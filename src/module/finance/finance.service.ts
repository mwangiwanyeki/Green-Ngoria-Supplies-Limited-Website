import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  generateInvoiceNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async createInvoice(
    organizationId: string,
    data: CreateInvoiceDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.assertInvoiceReferences(organizationId, data);

    const lineItems = data.lineItems.map((item) => {
      const lineTotal = new Prisma.Decimal(item.quantity).times(item.unitPrice);
      return { ...item, lineTotal };
    });
    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(item.lineTotal),
      new Prisma.Decimal(0),
    );
    const taxAmount = subtotal.times(data.taxRate).div(100);
    const totalAmount = subtotal.plus(taxAmount);

    const invoice = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const invoiceNumber = await generateInvoiceNumber(tx);
        const inv = await tx.invoice.create({
          data: {
            organizationId,
            clientId: data.clientId,
            contractId: data.contractId,
            projectId: data.projectId,
            invoiceNumber,
            status: 'DRAFT',
            currency: data.currency ?? 'USD',
            subtotal,
            taxRate: data.taxRate,
            taxAmount,
            totalAmount,
            amountPaid: 0,
            amountDue: totalAmount,
            dueDate: data.dueDate,
            notes: data.notes,
            createdById: userId,
          },
        });

        await tx.invoiceItem.createMany({
          data: lineItems.map((item) => ({
            invoiceId: inv.id,
            ...item,
            unit: 'EA',
          })),
        });

        return inv;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVOICE_CREATED,
      entity: 'Invoice',
      entityId: invoice.id,
    });
    return invoice;
  }

  async findAllInvoices(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    status?: InvoiceStatus,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.InvoiceWhereInput = { organizationId, deletedAt: null };
    if (status) where.status = status;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { client: { select: { id: true, companyName: true } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findInvoiceById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { lineItems: true, payments: true, client: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async issueInvoice(organizationId: string, id: string, userId: string) {
    const invoice = await this.findInvoiceById(organizationId, id, userId);
    if (invoice.status !== 'DRAFT')
      throw new BadRequestException('Only DRAFT invoices can be issued');

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: 'ISSUED', issuedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVOICE_ISSUED,
      entity: 'Invoice',
      entityId: id,
    });
    return updated;
  }

  // ─── Payments ─────────────────────────────────────────────────────────────

  async recordPayment(
    organizationId: string,
    invoiceId: string,
    data: RecordPaymentDto,
    userId: string,
  ) {
    // Membership + existence check up front (does not need to be
    // transactionally consistent with the balance mutation below).
    await this.findInvoiceById(organizationId, invoiceId, userId);

    const paymentAmount = new Prisma.Decimal(data.amount);

    const payment = await this.prisma.$transaction(async (tx) => {
      // Re-read the invoice INSIDE the transaction so the balance check and
      // the update operate on a consistent, up-to-date row — this closes the
      // race where two concurrent payments could both pass a stale check.
      const currentInvoice = await tx.invoice.findFirst({
        where: { id: invoiceId, organizationId, deletedAt: null },
      });
      if (!currentInvoice) {
        throw new NotFoundException('Invoice not found');
      }
      if (data.currency !== currentInvoice.currency) {
        throw new BadRequestException('Payment currency must match invoice');
      }
      if (paymentAmount.greaterThan(currentInvoice.amountDue)) {
        throw new BadRequestException('Payment exceeds the invoice balance');
      }

      const p = await tx.payment.create({
        data: {
          invoiceId,
          amount: data.amount,
          currency: data.currency ?? 'USD',
          method: data.method ?? 'BANK_TRANSFER',
          transactionRef: data.transactionRef,
          bankName: data.bankName,
          paymentDate: data.paymentDate,
          status: 'CONFIRMED',
          notes: data.notes,
        },
      });

      // Atomic increment/decrement — no read-modify-write race on the
      // invoice balance even under concurrent payments.
      const updated = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: { increment: paymentAmount },
          amountDue: { decrement: paymentAmount },
        },
      });

      const newStatus: InvoiceStatus = new Prisma.Decimal(
        updated.amountDue,
      ).lessThanOrEqualTo(0)
        ? 'PAID'
        : 'PARTIALLY_PAID';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          amountDue: Prisma.Decimal.max(0, updated.amountDue),
          ...(newStatus === 'PAID' ? { paidAt: new Date() } : {}),
        },
      });

      return p;
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.PAYMENT_CREATED,
      entity: 'Payment',
      entityId: payment.id,
    });
    return payment;
  }

  async getFinanceSummary(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const [totalInvoiced, totalPaid, overdueCount, draftCount] =
      await Promise.all([
        this.prisma.invoice.aggregate({
          where: { organizationId, deletedAt: null },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: { organizationId, status: 'PAID', deletedAt: null },
          _sum: { amountPaid: true },
        }),
        this.prisma.invoice.count({
          where: { organizationId, status: 'OVERDUE', deletedAt: null },
        }),
        this.prisma.invoice.count({
          where: { organizationId, status: 'DRAFT', deletedAt: null },
        }),
      ]);
    return {
      totalInvoiced: Number(totalInvoiced._sum.totalAmount ?? 0),
      totalPaid: Number(totalPaid._sum.amountPaid ?? 0),
      totalOutstanding:
        Number(totalInvoiced._sum.totalAmount ?? 0) -
        Number(totalPaid._sum.amountPaid ?? 0),
      overdueCount,
      draftCount,
    };
  }

  private async assertInvoiceReferences(
    organizationId: string,
    data: Pick<CreateInvoiceDto, 'clientId' | 'contractId' | 'projectId'>,
  ): Promise<void> {
    const [client, contract, project] = await Promise.all([
      data.clientId
        ? this.prisma.client.findFirst({
            where: { id: data.clientId, organizationId, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
      data.contractId
        ? this.prisma.contract.findFirst({
            where: { id: data.contractId, organizationId, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
      data.projectId
        ? this.prisma.project.findFirst({
            where: { id: data.projectId, organizationId, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (data.clientId && !client)
      throw new NotFoundException('Client not found');
    if (data.contractId && !contract)
      throw new NotFoundException('Contract not found');
    if (data.projectId && !project)
      throw new NotFoundException('Project not found');
  }
}

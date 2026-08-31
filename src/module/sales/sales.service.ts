import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  assertBranchInOrganization,
  branchScope,
} from '../../common/utils/branch-scope.util';
import { resolveDebtStatus } from '../../common/utils/debt-status.util';
import {
  generateReceiptNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { BranchScopeQueryDto } from '../../common/dto/branch-scope.dto';
import { CreateSaleDto, SaleLineItemDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { VoidSaleDto } from './dto/void-sale.dto';

/** A line after prices have been resolved and totals computed in Decimal. */
interface PricedLine {
  itemId?: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  discount: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  /**
   * POS checkout. One transaction creates the sale, its line items and its
   * payments, decrements stock atomically, writes a SALE stock movement per
   * stocked line, and opens or tops up the customer's debt account when the
   * sale leaves a balance owing. Any failure rolls the whole thing back.
   */
  async createSale(
    organizationId: string,
    data: CreateSaleDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);

    const discountAmount = new Prisma.Decimal(data.discountAmount ?? 0);
    const taxRate = new Prisma.Decimal(data.taxRate ?? 0);
    const payments = data.payments ?? [];
    const amountPaid = payments.reduce(
      (sum, p) => sum.plus(new Prisma.Decimal(p.amount)),
      new Prisma.Decimal(0),
    );

    const sale = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        // ── Resolve prices from the live item rows, inside the transaction ──
        const lines = await this.priceLines(
          tx,
          organizationId,
          data.branchId,
          data.items,
        );

        const subtotal = lines.reduce(
          (sum, line) => sum.plus(line.lineTotal),
          new Prisma.Decimal(0),
        );
        const taxable = subtotal.minus(discountAmount);
        if (taxable.lessThan(0)) {
          throw new BadRequestException(
            'Discount cannot exceed the sale subtotal',
          );
        }
        const taxAmount = taxable.times(taxRate).div(100);
        const totalAmount = taxable.plus(taxAmount);

        if (amountPaid.greaterThan(totalAmount)) {
          throw new BadRequestException('Payments exceed the sale total');
        }
        const amountDue = totalAmount.minus(amountPaid);

        if (amountDue.greaterThan(0) && !data.customerId) {
          throw new BadRequestException(
            'A credit sale requires a customer to bill',
          );
        }

        if (data.customerId) {
          const customer = await tx.customer.findFirst({
            where: {
              id: data.customerId,
              ...branchScope(organizationId, data.branchId),
            },
            select: { id: true },
          });
          if (!customer) throw new NotFoundException('Customer not found');
        }

        const status: SaleStatus = amountDue.lessThanOrEqualTo(0)
          ? SaleStatus.COMPLETED
          : amountPaid.greaterThan(0)
            ? SaleStatus.PARTIALLY_PAID
            : SaleStatus.CREDIT;

        const receiptNumber = await generateReceiptNumber(tx, data.branchId);

        const created = await tx.sale.create({
          data: {
            organizationId,
            branchId: data.branchId,
            customerId: data.customerId,
            cashierId: userId,
            receiptNumber,
            status,
            channel: data.channel ?? 'POS',
            subtotal,
            discountAmount,
            taxRate,
            taxAmount,
            totalAmount,
            amountPaid,
            amountDue,
            notes: data.notes,
            soldAt: data.soldAt ?? new Date(),
            lineItems: {
              create: lines.map((line) => ({
                itemId: line.itemId,
                name: line.name,
                sku: line.sku,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                discount: line.discount,
                lineTotal: line.lineTotal,
              })),
            },
            payments: {
              create: payments.map((p) => ({
                method: p.method,
                amount: new Prisma.Decimal(p.amount),
                reference: p.reference,
                paidAt: p.paidAt ?? new Date(),
              })),
            },
          },
        });

        // ── Stock: atomic decrement + ledger row per stocked line ───────────
        for (const line of lines) {
          if (!line.itemId) continue;

          const item = await tx.inventoryItem.update({
            where: { id: line.itemId },
            data: { quantity: { decrement: line.quantity } },
          });

          if (item.quantity < 0) {
            throw new BadRequestException(
              `Insufficient stock for ${line.name}`,
            );
          }

          await tx.stockMovement.create({
            data: {
              organizationId,
              branchId: data.branchId,
              itemId: line.itemId,
              storeId: item.storeId,
              type: 'SALE',
              quantityDelta: -line.quantity,
              balanceAfter: item.quantity,
              reason: `Sale ${receiptNumber}`,
              referenceType: 'Sale',
              referenceId: created.id,
              performedById: userId,
            },
          });
        }

        // ── Credit: open or top up the customer's debt account ──────────────
        if (amountDue.greaterThan(0) && data.customerId) {
          await this.applyDebtCharge(
            tx,
            organizationId,
            data.branchId,
            data.customerId,
            amountDue,
            data.dueDate,
          );
        }

        return created;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.SALE_CREATED,
      entity: 'Sale',
      entityId: sale.id,
      metadata: {
        branchId: data.branchId,
        receiptNumber: sale.receiptNumber,
        totalAmount: sale.totalAmount.toString(),
        status: sale.status,
      },
    });

    return this.findById(organizationId, sale.id, userId, data.branchId);
  }

  async findAll(organizationId: string, userId: string, query: QuerySalesDto) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'soldAt');

    const where: Prisma.SaleWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.status) where.status = query.status;
    if (query.channel) where.channel = query.channel;
    if (query.customerId) where.customerId = query.customerId;
    if (query.from || query.to) {
      where.soldAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    if (query.search) {
      where.OR = [
        { receiptNumber: { contains: query.search, mode: 'insensitive' } },
        {
          customer: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          lineItems: {
            some: { name: { contains: query.search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { lineItems: true } },
        },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const sale = await this.prisma.sale.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        lineItems: { include: { item: { select: { id: true, sku: true } } } },
        payments: true,
        customer: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  /**
   * Voids or refunds a sale, returning every stocked line to inventory with a
   * matching RETURN movement and unwinding any credit it created — all in one
   * transaction, using atomic increments so concurrent activity on the same
   * items or debt account cannot lose an update.
   */
  async voidSale(
    organizationId: string,
    id: string,
    data: VoidSaleDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);

    const result = await this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id, ...branchScope(organizationId, data.branchId) },
        include: { lineItems: true },
      });
      if (!sale) throw new NotFoundException('Sale not found');
      if (
        sale.status === SaleStatus.VOIDED ||
        sale.status === SaleStatus.REFUNDED
      ) {
        throw new BadRequestException('Sale has already been reversed');
      }

      for (const line of sale.lineItems) {
        if (!line.itemId) continue;

        // The item may have been archived since the sale; only live rows in
        // this org + branch are touched.
        const owned = await tx.inventoryItem.findFirst({
          where: {
            id: line.itemId,
            ...branchScope(organizationId, data.branchId),
          },
          select: { id: true },
        });
        if (!owned) continue;

        const item = await tx.inventoryItem.update({
          where: { id: line.itemId },
          data: { quantity: { increment: line.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            organizationId,
            branchId: data.branchId,
            itemId: line.itemId,
            storeId: item.storeId,
            type: 'RETURN',
            quantityDelta: line.quantity,
            balanceAfter: item.quantity,
            reason: `Reversal of sale ${sale.receiptNumber}: ${data.reason}`,
            referenceType: 'Sale',
            referenceId: sale.id,
            performedById: userId,
          },
        });
      }

      // Unwind the credit this sale put on the customer's account.
      const outstandingCharge = new Prisma.Decimal(sale.amountDue);
      if (outstandingCharge.greaterThan(0) && sale.customerId) {
        const account = await tx.customerDebtAccount.findFirst({
          where: {
            customerId: sale.customerId,
            ...branchScope(organizationId, data.branchId),
          },
          select: { id: true },
        });
        if (account) {
          const updated = await tx.customerDebtAccount.update({
            where: { id: account.id },
            data: {
              outstanding: { decrement: outstandingCharge },
              totalBilled: { decrement: outstandingCharge },
            },
          });
          await tx.customerDebtAccount.update({
            where: { id: account.id },
            data: {
              outstanding: Prisma.Decimal.max(0, updated.outstanding),
              status: resolveDebtStatus(
                Prisma.Decimal.max(0, updated.outstanding),
                updated.dueDate,
                updated.status,
              ),
            },
          });
        }
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: {
          status: data.refund ? SaleStatus.REFUNDED : SaleStatus.VOIDED,
          voidedAt: new Date(),
          amountDue: new Prisma.Decimal(0),
          notes: sale.notes
            ? `${sale.notes}\n[reversed] ${data.reason}`
            : `[reversed] ${data.reason}`,
        },
      });
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: data.refund ? AuditAction.SALE_REFUNDED : AuditAction.SALE_VOIDED,
      entity: 'Sale',
      entityId: id,
      metadata: { branchId: data.branchId, reason: data.reason },
    });
    return result;
  }

  /** Drives the Today Sales stat card: today's total, average and count. */
  async getTodaySummary(
    organizationId: string,
    userId: string,
    query: BranchScopeQueryDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const where: Prisma.SaleWhereInput = {
      ...branchScope(organizationId, query.branchId),
      soldAt: { gte: start, lt: end },
      status: { notIn: [SaleStatus.VOIDED, SaleStatus.DRAFT] },
    };

    const aggregate = await this.prisma.sale.aggregate({
      where,
      _sum: { totalAmount: true, amountPaid: true, amountDue: true },
      _count: { _all: true },
    });

    const total = new Prisma.Decimal(aggregate._sum.totalAmount ?? 0);
    const count = aggregate._count._all;
    const average =
      count > 0
        ? total.dividedBy(count).toDecimalPlaces(2)
        : new Prisma.Decimal(0);

    return {
      date: start,
      todayTotal: total.toString(),
      averageSale: average.toString(),
      saleCount: count,
      amountCollected: new Prisma.Decimal(
        aggregate._sum.amountPaid ?? 0,
      ).toString(),
      amountOnCredit: new Prisma.Decimal(
        aggregate._sum.amountDue ?? 0,
      ).toString(),
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /**
   * Resolves each requested line against the live inventory row (proving the
   * item belongs to this org + branch) and computes its total in Decimal.
   */
  private async priceLines(
    tx: Prisma.TransactionClient,
    organizationId: string,
    branchId: string,
    requested: SaleLineItemDto[],
  ): Promise<PricedLine[]> {
    const lines: PricedLine[] = [];

    for (const requestedLine of requested) {
      const discount = new Prisma.Decimal(requestedLine.discount ?? 0);

      if (!requestedLine.itemId) {
        if (!requestedLine.name || requestedLine.unitPrice === undefined) {
          throw new BadRequestException(
            'An ad-hoc line requires both a name and a unit price',
          );
        }
        const unitPrice = new Prisma.Decimal(requestedLine.unitPrice);
        const lineTotal = unitPrice
          .times(requestedLine.quantity)
          .minus(discount);
        if (lineTotal.lessThan(0)) {
          throw new BadRequestException(
            `Discount exceeds the line total for ${requestedLine.name}`,
          );
        }
        lines.push({
          name: requestedLine.name,
          quantity: requestedLine.quantity,
          unitPrice,
          discount,
          lineTotal,
        });
        continue;
      }

      const item = await tx.inventoryItem.findFirst({
        where: {
          id: requestedLine.itemId,
          ...branchScope(organizationId, branchId),
        },
        select: { id: true, name: true, sku: true, unitPrice: true },
      });
      if (!item) {
        throw new NotFoundException(
          `Inventory item ${requestedLine.itemId} not found`,
        );
      }

      const unitPrice =
        requestedLine.unitPrice !== undefined
          ? new Prisma.Decimal(requestedLine.unitPrice)
          : new Prisma.Decimal(item.unitPrice);
      const lineTotal = unitPrice.times(requestedLine.quantity).minus(discount);
      if (lineTotal.lessThan(0)) {
        throw new BadRequestException(
          `Discount exceeds the line total for ${item.name}`,
        );
      }

      lines.push({
        itemId: item.id,
        name: requestedLine.name ?? item.name,
        sku: item.sku,
        quantity: requestedLine.quantity,
        unitPrice,
        discount,
        lineTotal,
      });
    }

    return lines;
  }

  /**
   * Opens the customer's debt account if they have none, then charges it with
   * atomic increments and re-derives the status from the committed balance.
   */
  private async applyDebtCharge(
    tx: Prisma.TransactionClient,
    organizationId: string,
    branchId: string,
    customerId: string,
    amount: Prisma.Decimal,
    dueDate?: Date,
  ): Promise<void> {
    const existing = await tx.customerDebtAccount.findFirst({
      where: { customerId, ...branchScope(organizationId, branchId) },
      select: { id: true },
    });

    if (!existing) {
      await tx.customerDebtAccount.create({
        data: {
          organizationId,
          branchId,
          customerId,
          status: 'CURRENT',
          outstanding: amount,
          totalBilled: amount,
          dueDate,
        },
      });
      return;
    }

    const updated = await tx.customerDebtAccount.update({
      where: { id: existing.id },
      data: {
        outstanding: { increment: amount },
        totalBilled: { increment: amount },
        ...(dueDate ? { dueDate } : {}),
      },
    });

    await tx.customerDebtAccount.update({
      where: { id: existing.id },
      data: {
        status: resolveDebtStatus(
          updated.outstanding,
          updated.dueDate,
          updated.status,
        ),
      },
    });
  }

  private async assertScope(
    organizationId: string,
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.orgsService.assertMembership(organizationId, userId);
    await assertBranchInOrganization(this.prisma, organizationId, branchId);
  }
}

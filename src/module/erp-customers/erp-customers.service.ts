import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  assertBranchInOrganization,
  branchScope,
} from '../../common/utils/branch-scope.util';
import {
  generateCustomerNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class ErpCustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(
    organizationId: string,
    data: CreateCustomerDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!client) throw new NotFoundException('Client not found');
    }

    const customer = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const customerNumber = await generateCustomerNumber(tx, data.branchId);
        return tx.customer.create({
          data: {
            organizationId,
            branchId: data.branchId,
            clientId: data.clientId,
            customerNumber,
            name: data.name,
            phone: data.phone,
            email: data.email,
            company: data.company,
            address: data.address,
            notes: data.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ERP_CUSTOMER_CREATED,
      entity: 'Customer',
      entityId: customer.id,
      metadata: { branchId: data.branchId },
    });
    return customer;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query);

    const where: Prisma.CustomerWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
        { customerNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          debtAccount: {
            select: { id: true, status: true, outstanding: true },
          },
          _count: { select: { sales: true } },
        },
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        debtAccount: true,
        client: { select: { id: true, companyName: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateCustomerDto,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId, data.branchId);

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: data.clientId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!client) throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: {
        clientId: data.clientId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        company: data.company,
        address: data.address,
        notes: data.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ERP_CUSTOMER_UPDATED,
      entity: 'Customer',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDelete(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findById(organizationId, id, userId, branchId);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ERP_CUSTOMER_DELETED,
      entity: 'Customer',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  /** Sales history for one customer — parent ownership proven first. */
  async findSales(
    organizationId: string,
    id: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.findById(organizationId, id, userId, query.branchId);

    const { skip, take, orderBy } = buildPagination(query, 'soldAt');
    const where: Prisma.SaleWhereInput = {
      customerId: id,
      ...branchScope(organizationId, query.branchId),
    };

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { lineItems: true, payments: true },
      }),
      this.prisma.sale.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  /** Debt summary for one customer — outstanding, billed, paid, status. */
  async getDebtSummary(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findById(organizationId, id, userId, branchId);

    const account = await this.prisma.customerDebtAccount.findFirst({
      where: { customerId: id, ...branchScope(organizationId, branchId) },
      include: {
        payments: { orderBy: { paidAt: 'desc' }, take: 10 },
      },
    });

    if (!account) {
      return {
        hasAccount: false,
        status: null,
        creditLimit: '0',
        outstanding: '0',
        totalBilled: '0',
        totalPaid: '0',
        dueDate: null,
        lastPaymentAt: null,
        recentPayments: [],
      };
    }

    return {
      hasAccount: true,
      accountId: account.id,
      status: account.status,
      creditLimit: account.creditLimit.toString(),
      outstanding: account.outstanding.toString(),
      totalBilled: account.totalBilled.toString(),
      totalPaid: account.totalPaid.toString(),
      dueDate: account.dueDate,
      lastPaymentAt: account.lastPaymentAt,
      recentPayments: account.payments,
    };
  }

  /** Live customer count for the branch. Drives the reports overview KPI. */
  async getCount(
    organizationId: string,
    userId: string,
    branchId: string,
  ): Promise<number> {
    await this.assertScope(organizationId, userId, branchId);
    return this.prisma.customer.count({
      where: branchScope(organizationId, branchId),
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

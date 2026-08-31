import { Injectable } from '@nestjs/common';
import { QuotationStatus } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async getDashboard(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const [
      leadCounts,
      projectCounts,
      rfqCount,
      quotationStats,
      invoiceStats,
      hseCount,
      supportCount,
    ] = await Promise.all([
      // Lead pipeline counts
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
      }),

      // Project lifecycle counts
      this.prisma.project.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
      }),

      // Active RFQs
      this.prisma.rfq.count({
        where: {
          organizationId,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
          deletedAt: null,
        },
      }),

      // Quotation stats
      this.prisma.quotation.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          status: {
            notIn: [QuotationStatus.DRAFT, QuotationStatus.EXPIRED],
          },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Invoice summary
      this.prisma.invoice.aggregate({
        where: { organizationId, deletedAt: null },
        _sum: { totalAmount: true, amountPaid: true, amountDue: true },
      }),

      // Open HSE incidents
      this.prisma.hseIncident.count({
        where: { organizationId, closedAt: null },
      }),

      // Open support tickets
      this.prisma.supportTicket.count({
        where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
    ]);

    return {
      leads: {
        byStatus: Object.fromEntries(
          leadCounts.map((l) => [l.status, l._count._all]),
        ),
      },
      projects: {
        byStatus: Object.fromEntries(
          projectCounts.map((p) => [p.status, p._count._all]),
        ),
      },
      rfqs: { active: rfqCount },
      quotations: {
        total:
          typeof quotationStats._count === 'number' ? quotationStats._count : 0,
        totalValue: quotationStats._sum?.totalAmount ?? 0,
      },
      finance: {
        totalInvoiced: Number(invoiceStats._sum?.totalAmount ?? 0),
        totalPaid: Number(invoiceStats._sum?.amountPaid ?? 0),
        totalOutstanding: Number(invoiceStats._sum?.amountDue ?? 0),
      },
      hse: { openIncidents: hseCount },
      support: { openTickets: supportCount },
    };
  }
}

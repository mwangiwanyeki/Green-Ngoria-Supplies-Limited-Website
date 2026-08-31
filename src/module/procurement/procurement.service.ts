import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProcurementStatus } from '@prisma/client';
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
  generatePurchaseOrderNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { CreateProcurementQuoteDto } from './dto/create-quote.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

let reqCounter = 1000;

// Allowed workflow transitions
const PROCUREMENT_TRANSITIONS: Record<ProcurementStatus, ProcurementStatus[]> =
  {
    REQUISITION: ['PENDING_APPROVAL', 'CANCELLED'],
    PENDING_APPROVAL: ['APPROVED', 'REQUISITION'],
    APPROVED: ['SUPPLIER_RFQ'],
    SUPPLIER_RFQ: ['QUOTES_RECEIVED'],
    QUOTES_RECEIVED: ['COMPARISON', 'SUPPLIER_RFQ'],
    COMPARISON: ['APPROVED', 'PO_RAISED'],
    PO_RAISED: ['DELIVERY'],
    DELIVERY: ['RECEIVED'],
    RECEIVED: [],
    CANCELLED: [],
  };

const APPROVAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'DIRECTOR',
  'PROCUREMENT_OFFICER',
  'PRODUCTION_MANAGER',
];

@Injectable()
export class ProcurementService {
  private readonly logger = new Logger(ProcurementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Vendors ───────────────────────────────────────────────────────────────

  async createVendor(
    organizationId: string,
    dto: CreateVendorDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const vendor = await this.prisma.vendor.create({
      data: {
        organizationId,
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        country: dto.country ?? 'Kenya',
        address: dto.address,
        taxPin: dto.taxPin,
        website: dto.website,
        specializations: dto.specializations ?? [],
        notes: dto.notes,
      },
    });

    return vendor;
  }

  async findAllVendors(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.VendorWhereInput = { organizationId, deletedAt: null };

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { contactName: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { quotes: true, purchaseOrders: true } } },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findVendorById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        quotes: {
          orderBy: { receivedAt: 'desc' },
          take: 10,
          include: {
            requisition: { select: { requisitionNo: true, title: true } },
          },
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
          },
        },
      },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async approveVendor(organizationId: string, id: string, userId: string) {
    await this.findVendorById(organizationId, id, userId);
    return this.prisma.vendor.update({
      where: { id },
      data: { isApproved: true, approvedAt: new Date() },
    });
  }

  async updateVendor(
    organizationId: string,
    id: string,
    dto: Partial<CreateVendorDto>,
    userId: string,
  ) {
    await this.findVendorById(organizationId, id, userId);
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  // ─── Requisitions ──────────────────────────────────────────────────────────

  async createRequisition(
    organizationId: string,
    dto: CreateRequisitionDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    if (!dto.items?.length) {
      throw new BadRequestException(
        'Requisition must contain at least one item',
      );
    }

    const requisitionNo = `REQ-${++reqCounter}`;

    const requisition = await this.prisma.$transaction(async (tx) => {
      const req = await tx.procurementRequisition.create({
        data: {
          organizationId,
          projectId: dto.projectId,
          requisitionNo,
          title: dto.title,
          description: dto.description,
          urgency: dto.urgency ?? 'NORMAL',
          status: 'REQUISITION',
          requestedById: userId,
          requiredByDate: dto.requiredByDate,
          currency: dto.currency ?? 'USD',
          notes: dto.notes,
        },
      });

      await tx.procurementItem.createMany({
        data: dto.items.map((item) => ({
          requisitionId: req.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit ?? 'EA',
          estimatedPrice: item.estimatedPrice,
          technicalSpecs: item.technicalSpecs,
          notes: item.notes,
        })),
      });

      return req;
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.REQUISITION_CREATED,
      entity: 'ProcurementRequisition',
      entityId: requisition.id,
      newValues: { requisitionNo, title: dto.title },
    });

    return this.findRequisitionById(organizationId, requisition.id, userId);
  }

  async findAllRequisitions(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    status?: ProcurementStatus,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.ProcurementRequisitionWhereInput = { organizationId };
    if (status) where.status = status;

    if (pagination.search) {
      where.OR = [
        { requisitionNo: { contains: pagination.search, mode: 'insensitive' } },
        { title: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.procurementRequisition.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          project: { select: { id: true, projectNumber: true, name: true } },
          _count: { select: { items: true, quotes: true } },
        },
      }),
      this.prisma.procurementRequisition.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findRequisitionById(
    organizationId: string,
    id: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const req = await this.prisma.procurementRequisition.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
        quotes: {
          include: {
            vendor: {
              select: { id: true, name: true, country: true, isApproved: true },
            },
          },
          orderBy: { totalAmount: 'asc' },
        },
        purchaseOrder: {
          select: { id: true, poNumber: true, status: true, totalAmount: true },
        },
        project: { select: { id: true, projectNumber: true, name: true } },
      },
    });

    if (!req) throw new NotFoundException('Requisition not found');
    return req;
  }

  async transitionRequisition(
    organizationId: string,
    id: string,
    toStatus: ProcurementStatus,
    userId: string,
    userRoles: string[],
  ) {
    const req = await this.findRequisitionById(organizationId, id, userId);
    const current = req.status;
    const allowed = PROCUREMENT_TRANSITIONS[current] ?? [];

    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Approval requires authorised role
    if (toStatus === 'APPROVED' && current === 'PENDING_APPROVAL') {
      const hasRole = userRoles.some((r) => APPROVAL_ROLES.includes(r));
      if (!hasRole) {
        throw new BadRequestException(
          'You are not authorised to approve procurement requisitions',
        );
      }
    }

    const updateData: Prisma.ProcurementRequisitionUncheckedUpdateInput = {
      status: toStatus,
    };
    if (toStatus === 'APPROVED') {
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    }

    const updated = await this.prisma.procurementRequisition.update({
      where: { id },
      data: updateData,
    });

    if (toStatus === 'APPROVED') {
      await this.auditService.log({
        userId,
        organizationId,
        action: AuditAction.PROCUREMENT_APPROVED,
        entity: 'ProcurementRequisition',
        entityId: id,
        oldValues: { status: current },
        newValues: { status: toStatus },
      });
    }

    return updated;
  }

  // ─── Supplier quotes ────────────────────────────────────────────────────────

  async addSupplierQuote(
    organizationId: string,
    requisitionId: string,
    dto: CreateProcurementQuoteDto,
    userId: string,
  ) {
    await this.findRequisitionById(organizationId, requisitionId, userId);

    // Verify vendor belongs to this org
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId, deletedAt: null },
    });
    if (!vendor)
      throw new NotFoundException('Vendor not found in this organisation');

    return this.prisma.procurementQuote.create({
      data: {
        requisitionId,
        vendorId: dto.vendorId,
        quoteReference: dto.quoteReference,
        totalAmount: dto.totalAmount,
        currency: dto.currency ?? 'USD',
        leadTimeDays: dto.leadTimeDays,
        paymentTerms: dto.paymentTerms,
        technicalCompliance: dto.technicalCompliance ?? false,
        notes: dto.notes,
      },
    });
  }

  async selectQuote(
    organizationId: string,
    requisitionId: string,
    quoteId: string,
    userId: string,
  ) {
    await this.findRequisitionById(organizationId, requisitionId, userId);

    // Deselect all, then select the chosen one
    await this.prisma.$transaction(async (tx) => {
      await tx.procurementQuote.updateMany({
        where: { requisitionId },
        data: { isSelected: false },
      });
      await tx.procurementQuote.update({
        where: { id: quoteId },
        data: { isSelected: true },
      });
    });

    return { message: 'Supplier quote selected' };
  }

  // ─── Purchase orders ───────────────────────────────────────────────────────

  async createPurchaseOrder(
    organizationId: string,
    dto: CreatePurchaseOrderDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    let poNumber = '';
    const po = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        poNumber = await generatePurchaseOrderNumber(tx);
        return tx.purchaseOrder.create({
          data: {
            organizationId,
            requisitionId: dto.requisitionId,
            vendorId: dto.vendorId,
            poNumber,
            totalAmount: dto.totalAmount,
            currency: dto.currency ?? 'USD',
            paymentTerms: dto.paymentTerms,
            deliveryAddress: dto.deliveryAddress,
            expectedDelivery: dto.expectedDelivery,
            status: 'ISSUED',
            notes: dto.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.PURCHASE_ORDER_CREATED,
      entity: 'PurchaseOrder',
      entityId: po.id,
      newValues: {
        poNumber,
        vendorId: dto.vendorId,
        totalAmount: dto.totalAmount,
      },
    });

    return po;
  }

  async findAllPurchaseOrders(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: { organizationId },
        skip,
        take,
        orderBy,
        include: {
          vendor: { select: { id: true, name: true, country: true } },
          requisition: {
            select: { id: true, requisitionNo: true, title: true },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where: { organizationId } }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async updatePoStatus(
    organizationId: string,
    poId: string,
    status: string,
    userId: string,
  ) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: poId, organizationId },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const updates: Prisma.PurchaseOrderUncheckedUpdateInput = { status };
    if (status === 'DELIVERED') updates.actualDelivery = new Date();

    const updated = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: updates,
    });

    if (status === 'DELIVERED') {
      await this.auditService.log({
        userId,
        organizationId,
        action: AuditAction.DELIVERY_RECEIVED,
        entity: 'PurchaseOrder',
        entityId: poId,
        newValues: { status },
      });
    }

    return updated;
  }
}

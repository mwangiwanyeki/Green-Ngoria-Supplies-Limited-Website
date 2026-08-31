import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkOrderStatus } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  generateAssetNumber,
  generateWorkOrderNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';

const WO_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  OPEN: ['ASSIGNED'],
  ASSIGNED: ['IN_PROGRESS', 'OPEN'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED'],
  WAITING_PARTS: ['IN_PROGRESS'],
  COMPLETED: ['VERIFIED'],
  VERIFIED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Assets ───────────────────────────────────────────────────────────────

  async createAsset(
    organizationId: string,
    dto: CreateAssetDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const asset = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const assetNumber =
          dto.assetNumber ??
          (await generateAssetNumber(tx, dto.category ?? 'GEN'));
        return tx.asset.create({
          data: {
            organizationId,
            projectId: dto.projectId,
            equipmentId: dto.equipmentId,
            assetNumber,
            name: dto.name,
            serialNumber: dto.serialNumber,
            manufacturer: dto.manufacturer,
            model: dto.model,
            category: dto.category,
            location: dto.location,
            installationDate: dto.installationDate,
            status: dto.status ?? 'OPERATIONAL',
            condition: dto.condition ?? 'GOOD',
            warrantyExpiry: dto.warrantyExpiry,
            notes: dto.notes,
          },
        });
      }),
    );
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ASSET_CREATED,
      entity: 'Asset',
      entityId: asset.id,
    });
    return asset;
  }

  async findAllAssets(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.AssetWhereInput = { organizationId, deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { assetNumber: { contains: pagination.search, mode: 'insensitive' } },
        { serialNumber: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          project: { select: { id: true, projectNumber: true, name: true } },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findAssetById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const asset = await this.prisma.asset.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        workOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
        warranty: true,
        project: { select: { id: true, projectNumber: true, name: true } },
      },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  // ─── Work orders ──────────────────────────────────────────────────────────

  async createWorkOrder(
    organizationId: string,
    dto: CreateWorkOrderDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const wo = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const workOrderNumber = await generateWorkOrderNumber(tx);
        return tx.maintenanceWorkOrder.create({
          data: {
            organizationId,
            assetId: dto.assetId,
            workOrderNumber,
            type: dto.type,
            status: 'OPEN',
            title: dto.title,
            description: dto.description,
            scheduledDate: dto.scheduledDate,
            assignedToId: dto.assignedToId,
            currency: dto.currency ?? 'USD',
          },
        });
      }),
    );
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.MAINTENANCE_CREATED,
      entity: 'MaintenanceWorkOrder',
      entityId: wo.id,
    });
    return wo;
  }

  async findAllWorkOrders(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const [items, total] = await Promise.all([
      this.prisma.maintenanceWorkOrder.findMany({
        where: { organizationId },
        skip,
        take,
        orderBy,
        include: {
          asset: { select: { id: true, assetNumber: true, name: true } },
        },
      }),
      this.prisma.maintenanceWorkOrder.count({ where: { organizationId } }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async transitionWorkOrder(
    organizationId: string,
    id: string,
    toStatus: WorkOrderStatus,
    completionNotes: string | undefined,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const wo = await this.prisma.maintenanceWorkOrder.findFirst({
      where: { id, organizationId },
    });
    if (!wo) throw new NotFoundException('Work order not found');

    const allowed = WO_TRANSITIONS[wo.status] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${wo.status} to ${toStatus}`,
      );
    }

    if (toStatus === 'CLOSED' && !wo.completionNotes && !completionNotes) {
      throw new BadRequestException(
        'Completion notes are required before closing a work order',
      );
    }

    const updates: Prisma.MaintenanceWorkOrderUncheckedUpdateInput = {
      status: toStatus,
    };
    if (toStatus === 'IN_PROGRESS') updates.startedAt = new Date();
    if (toStatus === 'COMPLETED') {
      updates.completedAt = new Date();
      if (completionNotes) updates.completionNotes = completionNotes;
    }
    if (toStatus === 'CLOSED') updates.closedAt = new Date();

    const updated = await this.prisma.maintenanceWorkOrder.update({
      where: { id },
      data: updates,
    });
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.MAINTENANCE_COMPLETED,
      entity: 'MaintenanceWorkOrder',
      entityId: id,
    });
    return updated;
  }

  // ─── Warranty ─────────────────────────────────────────────────────────────

  async createWarranty(
    organizationId: string,
    assetId: string,
    dto: CreateWarrantyDto,
    userId: string,
  ) {
    await this.findAssetById(organizationId, assetId, userId);
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('Warranty end date must follow start date');
    }
    return this.prisma.warranty.upsert({
      where: { assetId },
      create: { assetId, ...dto },
      update: dto,
    });
  }

  async getExpiringWarranties(
    organizationId: string,
    userId: string,
    daysAhead = 90,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const deadline = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    return this.prisma.warranty.findMany({
      where: {
        asset: { organizationId },
        isActive: true,
        endDate: { lte: deadline },
      },
      include: {
        asset: { select: { id: true, assetNumber: true, name: true } },
      },
      orderBy: { endDate: 'asc' },
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockPileMovementType } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { BranchesService } from '../branches/branches.service';
import {
  buildPaginatedMeta,
  buildPagination,
} from '../../common/utils/pagination.util';
import {
  generateStockPileCode,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateStockPileDto } from './dto/create-stock-pile.dto';
import { UpdateStockPileDto } from './dto/update-stock-pile.dto';
import { QueryStockPilesDto } from './dto/query-stock-piles.dto';
import { RecordStockPileMovementDto } from './dto/record-stock-pile-movement.dto';
import { QueryStockPileMovementsDto } from './dto/query-stock-pile-movements.dto';
import { branchScope } from '../../common/utils/branch-scope.util';

/** Movement types whose magnitude is subtracted from the pile. */
const OUTBOUND_TYPES: StockPileMovementType[] = ['WITHDRAWAL', 'TRANSFER'];
/** Movement types that require an explicit signed delta. */
const SIGNED_TYPES: StockPileMovementType[] = [
  'ADJUSTMENT',
  'ASSAY_CORRECTION',
];

@Injectable()
export class StockPilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
    private readonly branches: BranchesService,
  ) {}

  private async assertScope(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.branches.assertBranchInOrganization(organizationId, branchId);
  }

  /** Resolve the signed tonnage delta a movement DTO represents. */
  private resolveDelta(dto: RecordStockPileMovementDto): Prisma.Decimal {
    if (SIGNED_TYPES.includes(dto.type)) {
      if (dto.signedTonnage === undefined) {
        throw new BadRequestException(
          `${dto.type} movements require a signedTonnage value`,
        );
      }
      return new Prisma.Decimal(dto.signedTonnage);
    }
    if (dto.tonnage === undefined) {
      throw new BadRequestException(
        `${dto.type} movements require a tonnage value`,
      );
    }
    const magnitude = new Prisma.Decimal(dto.tonnage);
    if (magnitude.lessThanOrEqualTo(0)) {
      throw new BadRequestException('tonnage must be greater than zero');
    }
    return OUTBOUND_TYPES.includes(dto.type) ? magnitude.negated() : magnitude;
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateStockPileDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, dto.branchId, userId);

    const openingTonnage = new Prisma.Decimal(dto.tonnage ?? 0);

    const pile = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        if (dto.miningSiteId) {
          const site = await tx.miningSite.findFirst({
            where: { id: dto.miningSiteId },
            select: { id: true },
          });
          if (!site) throw new NotFoundException('Mining site not found');
        }

        const code = dto.code ?? (await generateStockPileCode(tx, dto.branchId));

        const created = await tx.stockPile.create({
          data: {
            organizationId,
            branchId: dto.branchId,
            miningSiteId: dto.miningSiteId,
            code,
            name: dto.name,
            oreType: dto.oreType,
            mineralType: dto.mineralType,
            location: dto.location,
            status: dto.status,
            tonnage: openingTonnage,
            estimatedGrade:
              dto.estimatedGrade === undefined
                ? undefined
                : new Prisma.Decimal(dto.estimatedGrade),
            estimatedValue:
              dto.estimatedValue === undefined
                ? undefined
                : new Prisma.Decimal(dto.estimatedValue),
            currency: dto.currency,
            notes: dto.notes,
          },
        });

        // Journal the opening balance so the movement ledger always
        // reconciles with `tonnage`.
        if (openingTonnage.greaterThan(0)) {
          await tx.stockPileMovement.create({
            data: {
              organizationId,
              branchId: dto.branchId,
              stockPileId: created.id,
              type: 'DEPOSIT',
              tonnageDelta: openingTonnage,
              balanceAfter: openingTonnage,
              reason: 'Opening balance',
              recordedById: userId,
            },
          });
        }

        return created;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STOCK_PILE_CREATED,
      entity: 'StockPile',
      entityId: pile.id,
      newValues: { code: pile.code, name: pile.name, branchId: pile.branchId },
    });
    return pile;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QueryStockPilesDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);
    const { skip, take, orderBy } = buildPagination(query);

    const where: Prisma.StockPileWhereInput = {
      organizationId,
      branchId: query.branchId,
      deletedAt: null,
    };
    if (query.status) where.status = query.status;
    if (query.miningSiteId) where.miningSiteId = query.miningSiteId;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { oreType: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.stockPile.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { miningSite: { select: { id: true, name: true } } },
      }),
      this.prisma.stockPile.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const pile = await this.prisma.stockPile.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        miningSite: { select: { id: true, name: true } },
        movements: { orderBy: { occurredAt: 'desc' }, take: 20 },
      },
    });
    if (!pile) throw new NotFoundException('Stockpile not found');
    return pile;
  }

  async update(
    organizationId: string,
    branchId: string,
    id: string,
    dto: UpdateStockPileDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const existing = await this.prisma.stockPile.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!existing) throw new NotFoundException('Stockpile not found');

    if (dto.miningSiteId) {
      const site = await this.prisma.miningSite.findFirst({
        where: { id: dto.miningSiteId },
        select: { id: true },
      });
      if (!site) throw new NotFoundException('Mining site not found');
    }

    const updated = await this.prisma.stockPile.update({
      where: { id },
      data: {
        miningSiteId: dto.miningSiteId,
        code: dto.code,
        name: dto.name,
        oreType: dto.oreType,
        mineralType: dto.mineralType,
        location: dto.location,
        status: dto.status,
        estimatedGrade:
          dto.estimatedGrade === undefined
            ? undefined
            : new Prisma.Decimal(dto.estimatedGrade),
        estimatedValue:
          dto.estimatedValue === undefined
            ? undefined
            : new Prisma.Decimal(dto.estimatedValue),
        currency: dto.currency,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STOCK_PILE_UPDATED,
      entity: 'StockPile',
      entityId: id,
      oldValues: { status: existing.status, name: existing.name },
      newValues: { status: updated.status, name: updated.name },
    });
    return updated;
  }

  async remove(
    organizationId: string,
    branchId: string,
    id: string,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const pile = await this.prisma.stockPile.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!pile) throw new NotFoundException('Stockpile not found');
    if (new Prisma.Decimal(pile.tonnage).greaterThan(0)) {
      throw new BadRequestException(
        'Stockpile still holds ore — draw it down before deleting',
      );
    }

    await this.prisma.stockPile.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DEPLETED' },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STOCK_PILE_DELETED,
      entity: 'StockPile',
      entityId: id,
      oldValues: { code: pile.code },
    });
    return { id, deleted: true };
  }

  // ─── Movements ─────────────────────────────────────────────────────────────

  /**
   * Record a tonnage movement.
   *
   * The pile balance is mutated with an atomic `increment` inside a
   * `$transaction` — never read-then-write — and the resulting balance is what
   * lands in `balanceAfter`. A movement that would drive the pile negative
   * throws, which rolls the whole transaction back.
   */
  async recordMovement(
    organizationId: string,
    branchId: string,
    stockPileId: string,
    dto: RecordStockPileMovementDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, branchId, userId);
    const delta = this.resolveDelta(dto);

    const movement = await this.prisma.$transaction(async (tx) => {
      const pile = await tx.stockPile.findFirst({
        where: { id: stockPileId, ...branchScope(organizationId, branchId) },
      });
      if (!pile) throw new NotFoundException('Stockpile not found');

      const updated = await tx.stockPile.update({
        where: { id: pile.id },
        data: { tonnage: { increment: delta } },
      });

      const balanceAfter = new Prisma.Decimal(updated.tonnage);
      if (balanceAfter.lessThan(0)) {
        // Rolls back the increment above.
        throw new BadRequestException(
          'Movement would drive the stockpile tonnage below zero',
        );
      }

      return tx.stockPileMovement.create({
        data: {
          organizationId,
          branchId: pile.branchId,
          stockPileId: pile.id,
          type: dto.type,
          tonnageDelta: delta,
          balanceAfter,
          grade:
            dto.grade === undefined ? undefined : new Prisma.Decimal(dto.grade),
          reason: dto.reason,
          recordedById: userId,
          occurredAt: dto.occurredAt ?? new Date(),
        },
      });
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STOCK_PILE_MOVEMENT_RECORDED,
      entity: 'StockPileMovement',
      entityId: movement.id,
      newValues: {
        stockPileId,
        type: dto.type,
        tonnageDelta: delta.toString(),
        balanceAfter: movement.balanceAfter.toString(),
      },
    });
    return movement;
  }

  async findMovements(
    organizationId: string,
    stockPileId: string,
    userId: string,
    query: QueryStockPileMovementsDto,
  ) {
    await this.assertScope(organizationId, query.branchId, userId);

    // Child-resource scoping: the pile must belong to BOTH the caller's
    // organization and the branch they claim to be working in.
    const pile = await this.prisma.stockPile.findFirst({
      where: {
        id: stockPileId,
        organizationId,
        branchId: query.branchId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!pile) throw new NotFoundException('Stockpile not found');

    const { skip, take, orderBy } = buildPagination(query, 'occurredAt');
    const where: Prisma.StockPileMovementWhereInput = {
      organizationId,
      branchId: query.branchId,
      stockPileId,
    };
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.occurredAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.stockPileMovement.findMany({ where, skip, take, orderBy }),
      this.prisma.stockPileMovement.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(organizationId: string, branchId: string, userId: string) {
    await this.assertScope(organizationId, branchId, userId);

    const where: Prisma.StockPileWhereInput = {
      organizationId,
      branchId,
      deletedAt: null,
    };

    const [totals, byStatus, pileCount] = await Promise.all([
      this.prisma.stockPile.aggregate({
        where,
        _sum: { tonnage: true, estimatedValue: true },
        _avg: { estimatedGrade: true },
      }),
      this.prisma.stockPile.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
        _sum: { tonnage: true },
      }),
      this.prisma.stockPile.count({ where }),
    ]);

    const zero = new Prisma.Decimal(0);
    return {
      totalTonnage: totals._sum.tonnage ?? zero,
      totalEstimatedValue: totals._sum.estimatedValue ?? zero,
      averageGrade: totals._avg.estimatedGrade,
      pileCount,
      countByStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      tonnageByStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._sum.tonnage ?? zero]),
      ),
    };
  }
}

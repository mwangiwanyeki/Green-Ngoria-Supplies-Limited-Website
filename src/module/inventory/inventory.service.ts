import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BranchScopeQueryDto } from '../../common/dto/branch-scope.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  assertBranchInOrganization,
  branchScope,
} from '../../common/utils/branch-scope.util';
import {
  generateSku,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import {
  InventoryStockFilter,
  QueryInventoryDto,
} from './dto/query-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Items ────────────────────────────────────────────────────────────────

  async createItem(
    organizationId: string,
    data: CreateInventoryItemDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    await this.assertItemReferences(organizationId, data.branchId, data);

    const openingQuantity = data.quantity ?? 0;

    const item = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const sku = await generateSku(tx, data.branchId);
        const created = await tx.inventoryItem.create({
          data: {
            organizationId,
            branchId: data.branchId,
            storeId: data.storeId,
            categoryId: data.categoryId,
            sku,
            name: data.name,
            description: data.description,
            unitOfMeasure: data.unitOfMeasure ?? 'pcs',
            unitPrice: new Prisma.Decimal(data.unitPrice),
            costPrice: new Prisma.Decimal(data.costPrice ?? 0),
            quantity: openingQuantity,
            reorderLevel: data.reorderLevel ?? 10,
            barcode: data.barcode,
            imageUrl: data.imageUrl,
            isActive: data.isActive ?? true,
            isPublished: data.isPublished ?? false,
          },
        });

        // An opening balance is a stock movement like any other, so the
        // ledger reconciles to `quantity` from the very first row.
        if (openingQuantity !== 0) {
          await tx.stockMovement.create({
            data: {
              organizationId,
              branchId: data.branchId,
              itemId: created.id,
              storeId: data.storeId,
              type: 'OPENING_BALANCE',
              quantityDelta: openingQuantity,
              balanceAfter: openingQuantity,
              unitCost:
                data.costPrice !== undefined
                  ? new Prisma.Decimal(data.costPrice)
                  : undefined,
              reason: 'Opening balance',
              performedById: userId,
            },
          });
        }

        return created;
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_ITEM_CREATED,
      entity: 'InventoryItem',
      entityId: item.id,
      metadata: { branchId: data.branchId, sku: item.sku },
    });
    return item;
  }

  async findAllItems(
    organizationId: string,
    userId: string,
    query: QueryInventoryDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'name');

    const where: Prisma.InventoryItemWhereInput = branchScope(
      organizationId,
      query.branchId,
    );

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.storeId) where.storeId = query.storeId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
        {
          category: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    switch (query.filter) {
      case InventoryStockFilter.OUT_OF_STOCK:
        where.quantity = { lte: 0 };
        break;
      case InventoryStockFilter.LOW_STOCK:
        // At or below the reorder level but not yet exhausted. The column
        // reference keeps the comparison in the database.
        where.quantity = {
          gt: 0,
          lte: this.prisma.inventoryItem.fields.reorderLevel,
        };
        break;
      default:
        break;
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findItemById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
      include: {
        category: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async updateItem(
    organizationId: string,
    id: string,
    data: UpdateInventoryItemDto,
    userId: string,
  ) {
    await this.findItemById(organizationId, id, userId, data.branchId);
    await this.assertItemReferences(organizationId, data.branchId, data);

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        storeId: data.storeId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        unitOfMeasure: data.unitOfMeasure,
        unitPrice:
          data.unitPrice !== undefined
            ? new Prisma.Decimal(data.unitPrice)
            : undefined,
        costPrice:
          data.costPrice !== undefined
            ? new Prisma.Decimal(data.costPrice)
            : undefined,
        reorderLevel: data.reorderLevel,
        barcode: data.barcode,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        isPublished: data.isPublished,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_ITEM_UPDATED,
      entity: 'InventoryItem',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDeleteItem(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findItemById(organizationId, id, userId, branchId);
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_ITEM_DELETED,
      entity: 'InventoryItem',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  // ─── Stock movements ──────────────────────────────────────────────────────

  /**
   * Applies a signed stock change and writes the matching ledger row.
   *
   * The quantity is mutated with an atomic `increment` inside a transaction —
   * never read-then-write — so concurrent adjustments cannot lose an update.
   * The resulting balance is checked AFTER the increment; a negative result
   * rolls the whole transaction back.
   */
  async adjustStock(
    organizationId: string,
    itemId: string,
    data: AdjustStockDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);

    if (data.storeId) {
      await this.assertStoreInScope(
        organizationId,
        data.branchId,
        data.storeId,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Re-check ownership inside the transaction so the scope check and the
      // mutation see the same snapshot.
      const existing = await tx.inventoryItem.findFirst({
        where: { id: itemId, ...branchScope(organizationId, data.branchId) },
        select: { id: true },
      });
      if (!existing) throw new NotFoundException('Inventory item not found');

      const item = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: { increment: data.quantityDelta } },
      });

      if (item.quantity < 0) {
        throw new BadRequestException('Adjustment would take stock below zero');
      }

      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          branchId: data.branchId,
          itemId,
          storeId: data.storeId,
          type: data.type,
          quantityDelta: data.quantityDelta,
          balanceAfter: item.quantity,
          unitCost:
            data.unitCost !== undefined
              ? new Prisma.Decimal(data.unitCost)
              : undefined,
          reason: data.reason,
          performedById: userId,
        },
      });

      return { item, movement };
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_STOCK_ADJUSTED,
      entity: 'InventoryItem',
      entityId: itemId,
      metadata: {
        branchId: data.branchId,
        quantityDelta: data.quantityDelta,
        balanceAfter: result.item.quantity,
        type: data.type,
      },
    });
    return result;
  }

  async findItemMovements(
    organizationId: string,
    itemId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    // Proves the parent item belongs to this org + branch before any child
    // rows are read — no child-resource IDOR.
    await this.findItemById(organizationId, itemId, userId, query.branchId);

    const { skip, take, orderBy } = buildPagination(query);
    const where: Prisma.StockMovementWhereInput = {
      itemId,
      organizationId,
      branchId: query.branchId,
    };

    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          performedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          store: { select: { id: true, name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, query) };
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  /** Drives the "STOCK ON HAND" hero card: value, in-stock and out-of-stock. */
  async getStats(
    organizationId: string,
    userId: string,
    query: BranchScopeQueryDto,
  ) {
    await this.assertScope(organizationId, userId, query.branchId);

    // SUM(unitPrice * quantity) is a product of two columns, which the Prisma
    // aggregate API cannot express — parameterised raw SQL keeps it in the DB
    // and in Decimal arithmetic rather than summing in JavaScript floats.
    const [valueRows, inStock, outOfStock, lowStock, totalItems] =
      await Promise.all([
        this.prisma.$queryRaw<{ value: Prisma.Decimal | null }[]>`
          SELECT COALESCE(SUM("unitPrice" * "quantity"), 0)::numeric AS value
          FROM "inventory_items"
          WHERE "organizationId" = ${organizationId}
            AND "branchId" = ${query.branchId}
            AND "deletedAt" IS NULL
            AND "quantity" > 0
        `,
        this.prisma.inventoryItem.count({
          where: {
            ...branchScope(organizationId, query.branchId),
            quantity: { gt: 0 },
          },
        }),
        this.prisma.inventoryItem.count({
          where: {
            ...branchScope(organizationId, query.branchId),
            quantity: { lte: 0 },
          },
        }),
        this.prisma.inventoryItem.count({
          where: {
            ...branchScope(organizationId, query.branchId),
            quantity: {
              gt: 0,
              lte: this.prisma.inventoryItem.fields.reorderLevel,
            },
          },
        }),
        this.prisma.inventoryItem.count({
          where: branchScope(organizationId, query.branchId),
        }),
      ]);

    const stockOnHandValue = new Prisma.Decimal(valueRows[0]?.value ?? 0);

    return {
      stockOnHandValue: stockOnHandValue.toString(),
      inStockCount: inStock,
      outOfStockCount: outOfStock,
      lowStockCount: lowStock,
      totalItems,
    };
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  async createCategory(
    organizationId: string,
    data: CreateInventoryCategoryDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const category = await this.prisma.inventoryCategory.create({
      data: {
        organizationId,
        branchId: data.branchId,
        name: data.name,
        description: data.description,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_CATEGORY_CREATED,
      entity: 'InventoryCategory',
      entityId: category.id,
      metadata: { branchId: data.branchId },
    });
    return category;
  }

  async findAllCategories(
    organizationId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'name');
    const where: Prisma.InventoryCategoryWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryCategory.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.inventoryCategory.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findCategoryById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!category) throw new NotFoundException('Inventory category not found');
    return category;
  }

  async updateCategory(
    organizationId: string,
    id: string,
    data: UpdateInventoryCategoryDto,
    userId: string,
  ) {
    await this.findCategoryById(organizationId, id, userId, data.branchId);
    const updated = await this.prisma.inventoryCategory.update({
      where: { id },
      data: { name: data.name, description: data.description },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_CATEGORY_UPDATED,
      entity: 'InventoryCategory',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDeleteCategory(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findCategoryById(organizationId, id, userId, branchId);
    await this.prisma.inventoryCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.INVENTORY_CATEGORY_DELETED,
      entity: 'InventoryCategory',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  // ─── Stores ───────────────────────────────────────────────────────────────

  async createStore(
    organizationId: string,
    data: CreateStoreDto,
    userId: string,
  ) {
    await this.assertScope(organizationId, userId, data.branchId);
    const store = await this.prisma.store.create({
      data: {
        organizationId,
        branchId: data.branchId,
        name: data.name,
        location: data.location,
        description: data.description,
        isDefault: data.isDefault ?? false,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STORE_CREATED,
      entity: 'Store',
      entityId: store.id,
      metadata: { branchId: data.branchId },
    });
    return store;
  }

  async findAllStores(
    organizationId: string,
    userId: string,
    query: PaginationDto & { branchId: string },
  ) {
    await this.assertScope(organizationId, userId, query.branchId);
    const { skip, take, orderBy } = buildPagination(query, 'name');
    const where: Prisma.StoreWhereInput = branchScope(
      organizationId,
      query.branchId,
    );
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.store.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findStoreById(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.assertScope(organizationId, userId, branchId);
    const store = await this.prisma.store.findFirst({
      where: { id, ...branchScope(organizationId, branchId) },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async updateStore(
    organizationId: string,
    id: string,
    data: UpdateStoreDto,
    userId: string,
  ) {
    await this.findStoreById(organizationId, id, userId, data.branchId);
    const updated = await this.prisma.store.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        description: data.description,
        isDefault: data.isDefault,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STORE_UPDATED,
      entity: 'Store',
      entityId: id,
      metadata: { branchId: data.branchId },
    });
    return updated;
  }

  async softDeleteStore(
    organizationId: string,
    id: string,
    userId: string,
    branchId: string,
  ) {
    await this.findStoreById(organizationId, id, userId, branchId);
    await this.prisma.store.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.STORE_DELETED,
      entity: 'Store',
      entityId: id,
      metadata: { branchId },
    });
    return { id, deleted: true };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /**
   * Org membership + branch ownership. `branchId` is caller-supplied, so it is
   * always verified against the organization before it reaches a `where`.
   */
  private async assertScope(
    organizationId: string,
    userId: string,
    branchId: string,
  ): Promise<void> {
    await this.orgsService.assertMembership(organizationId, userId);
    await assertBranchInOrganization(this.prisma, organizationId, branchId);
  }

  private async assertStoreInScope(
    organizationId: string,
    branchId: string,
    storeId: string,
  ): Promise<void> {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, ...branchScope(organizationId, branchId) },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Store not found');
  }

  private async assertItemReferences(
    organizationId: string,
    branchId: string,
    data: Pick<CreateInventoryItemDto, 'storeId' | 'categoryId'>,
  ): Promise<void> {
    if (data.storeId) {
      await this.assertStoreInScope(organizationId, branchId, data.storeId);
    }
    if (data.categoryId) {
      const category = await this.prisma.inventoryCategory.findFirst({
        where: {
          id: data.categoryId,
          ...branchScope(organizationId, branchId),
        },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Inventory category not found');
      }
    }
  }
}

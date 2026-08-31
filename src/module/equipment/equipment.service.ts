import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateSparePartDto } from './dto/create-spare-part.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Equipment ─────────────────────────────────────────────────────────────

  async createEquipment(dto: CreateEquipmentDto) {
    const existing = await this.prisma.equipment.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException(`SKU ${dto.sku} already exists`);

    return this.prisma.equipment.create({
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        model: dto.model,
        manufacturer: dto.manufacturer,
        description: dto.description,
        application: dto.application,
        capacity: dto.capacity,
        powerKw: dto.powerKw,
        weight: dto.weight,
        dimensions: dto.dimensions,
        specifications: dto.specifications
          ? (dto.specifications as Prisma.InputJsonObject)
          : Prisma.JsonNull,
        isAvailable: dto.isAvailable ?? true,
        leadTimeDays: dto.leadTimeDays,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async findAllEquipment(pagination: PaginationDto, publishedOnly = false) {
    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.EquipmentWhereInput = { deletedAt: null };
    if (publishedOnly) where.isPublished = true;

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { sku: { contains: pagination.search, mode: 'insensitive' } },
        { manufacturer: { contains: pagination.search, mode: 'insensitive' } },
        { application: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { spares: true } },
        },
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findEquipmentById(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        spares: {
          where: { deletedAt: null },
          select: {
            id: true,
            sku: true,
            name: true,
            partNumber: true,
            isAvailable: true,
            unitPrice: true,
            currency: true,
          },
        },
      },
    });
    if (!equipment) throw new NotFoundException('Equipment not found');
    return equipment;
  }

  async updateEquipment(id: string, dto: Partial<CreateEquipmentDto>) {
    await this.findEquipmentById(id);
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...dto,
        specifications: dto.specifications
          ? (dto.specifications as Prisma.InputJsonObject)
          : undefined,
      },
    });
  }

  async publishEquipment(id: string) {
    await this.findEquipmentById(id);
    return this.prisma.equipment.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async unpublishEquipment(id: string) {
    await this.findEquipmentById(id);
    return this.prisma.equipment.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  async deleteEquipment(id: string) {
    await this.findEquipmentById(id);
    await this.prisma.equipment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Equipment archived' };
  }

  // ─── Equipment categories ──────────────────────────────────────────────────

  async createCategory(name: string, description?: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.equipmentCategory.create({
      data: { name, slug, description, parentId, sortOrder: 0 },
    });
  }

  async findAllCategories() {
    return this.prisma.equipmentCategory.findMany({
      where: { parentId: null },
      include: { children: true, _count: { select: { equipment: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── Spare Parts ───────────────────────────────────────────────────────────

  async createSparePart(dto: CreateSparePartDto) {
    const existing = await this.prisma.sparePart.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException(`SKU ${dto.sku} already exists`);

    return this.prisma.sparePart.create({
      data: {
        equipmentId: dto.equipmentId,
        sku: dto.sku,
        name: dto.name,
        partNumber: dto.partNumber,
        manufacturer: dto.manufacturer,
        description: dto.description,
        quantityInStock: dto.quantityInStock ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
        unitPrice: dto.unitPrice,
        currency: dto.currency ?? 'USD',
        isAvailable: dto.isAvailable ?? true,
        leadTimeDays: dto.leadTimeDays,
        compatibleEquipment: dto.compatibleEquipment ?? [],
      },
    });
  }

  async findAllSpareParts(pagination: PaginationDto, equipmentId?: string) {
    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.SparePartWhereInput = { deletedAt: null };
    if (equipmentId) where.equipmentId = equipmentId;

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { sku: { contains: pagination.search, mode: 'insensitive' } },
        { partNumber: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sparePart.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { equipment: { select: { id: true, name: true, sku: true } } },
      }),
      this.prisma.sparePart.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findSparePartById(id: string) {
    const spare = await this.prisma.sparePart.findUnique({
      where: { id, deletedAt: null },
      include: { equipment: true },
    });
    if (!spare) throw new NotFoundException('Spare part not found');
    return spare;
  }

  async updateSparePart(id: string, dto: Partial<CreateSparePartDto>) {
    await this.findSparePartById(id);
    return this.prisma.sparePart.update({ where: { id }, data: dto });
  }

  async adjustStock(id: string, adjustment: number, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('A stock adjustment reason is required');
    }
    const spare = await this.findSparePartById(id);
    const newQty = spare.quantityInStock + adjustment;
    if (newQty < 0)
      throw new ConflictException('Stock quantity cannot go below zero');
    return this.prisma.sparePart.update({
      where: { id },
      data: { quantityInStock: newQty },
    });
  }
}

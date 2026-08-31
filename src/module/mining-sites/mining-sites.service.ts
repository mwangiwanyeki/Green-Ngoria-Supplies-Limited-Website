import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateMiningSiteDto } from './dto/create-mining-site.dto';

@Injectable()
export class MiningSitesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMiningSiteDto) {
    return this.prisma.miningSite.create({
      data: {
        name: dto.name,
        country: dto.country ?? 'Kenya',
        county: dto.county,
        coordinates: dto.coordinates,
        mineralTypes: dto.mineralTypes ?? [],
        description: dto.description,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.MiningSiteWhereInput = { isActive: true };

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { county: { contains: pagination.search, mode: 'insensitive' } },
        { country: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.miningSite.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: { select: { projects: true, assessments: true } },
        },
      }),
      this.prisma.miningSite.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(id: string) {
    const site = await this.prisma.miningSite.findUnique({
      where: { id },
      include: {
        projects: {
          where: { deletedAt: null },
          select: { id: true, projectNumber: true, name: true, status: true },
          take: 10,
        },
        assessments: {
          where: { deletedAt: null },
          select: { id: true, reference: true, status: true, clientName: true },
          take: 10,
        },
      },
    });
    if (!site) throw new NotFoundException('Mining site not found');
    return site;
  }

  async update(id: string, dto: Partial<CreateMiningSiteDto>) {
    await this.findById(id);
    return this.prisma.miningSite.update({ where: { id }, data: dto });
  }
}

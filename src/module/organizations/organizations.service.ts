import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CacheService } from '../../lib/cache/cache.service';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
  ) {}

  // ─── Slug helper ───────────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug },
      });
      if (!existing || existing.id === excludeId) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateOrganizationDto, createdById: string) {
    const baseSlug = this.generateSlug(dto.name);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type ?? 'CLIENT',
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        country: dto.country ?? 'Kenya',
        city: dto.city,
        address: dto.address,
        taxPin: dto.taxPin,
        description: dto.description,
      },
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.ORG_CREATED,
      entity: 'Organization',
      entityId: org.id,
      newValues: { name: org.name, type: org.type },
    });

    return org;
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.OrganizationWhereInput = { deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { slug: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          email: true,
          phone: true,
          country: true,
          city: true,
          isActive: true,
          createdAt: true,
          _count: { select: { members: true, projects: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { members: true, projects: true, clients: true },
        },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug, deletedAt: null },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, updatedById: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id, deletedAt: null },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const updated = await this.prisma.organization.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId: updatedById,
      organizationId: id,
      action: AuditAction.ORG_UPDATED,
      entity: 'Organization',
      entityId: id,
      oldValues: { name: org.name },
      newValues: dto as Record<string, unknown>,
    });

    return updated;
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async getMembers(organizationId: string, pagination: PaginationDto) {
    const { skip, take } = buildPagination(pagination);

    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: { organizationId, removedAt: null },
        skip,
        take,
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      this.prisma.organizationMember.count({
        where: { organizationId, removedAt: null },
      }),
    ]);

    return { items: members, meta: buildPaginatedMeta(total, pagination) };
  }

  async addMember(
    organizationId: string,
    dto: AddMemberDto,
    addedById: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId, deletedAt: null },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: dto.userId },
      },
    });

    if (existing && !existing.removedAt) {
      throw new ConflictException('User is already a member');
    }

    if (existing) {
      // Re-add previously removed member
      await this.prisma.organizationMember.update({
        where: {
          organizationId_userId: { organizationId, userId: dto.userId },
        },
        data: {
          removedAt: null,
          role: dto.role ?? 'CLIENT_USER',
          joinedAt: new Date(),
        },
      });
    } else {
      await this.prisma.organizationMember.create({
        data: {
          organizationId,
          userId: dto.userId,
          role: dto.role ?? 'CLIENT_USER',
        },
      });
    }

    await this.auditService.log({
      userId: addedById,
      organizationId,
      action: AuditAction.ORG_MEMBER_ADDED,
      entity: 'Organization',
      entityId: organizationId,
      newValues: { userId: dto.userId, role: dto.role },
    });

    await this.cache.del(`assertMembership:${organizationId}:${dto.userId}`);
    return { message: 'Member added' };
  }

  async removeMember(
    organizationId: string,
    userId: string,
    removedById: string,
  ) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });

    if (!member || member.removedAt) {
      throw new NotFoundException('Member not found');
    }

    if (member.isOwner) {
      throw new BadRequestException('Cannot remove the organization owner');
    }

    await this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { removedAt: new Date() },
    });

    await this.cache.del(`assertMembership:${organizationId}:${userId}`);

    await this.auditService.log({
      userId: removedById,
      organizationId,
      action: AuditAction.ORG_MEMBER_REMOVED,
      entity: 'Organization',
      entityId: organizationId,
      oldValues: { userId },
    });

    return { message: 'Member removed' };
  }

  async changeMemberRole(
    organizationId: string,
    userId: string,
    newRole: SystemRole,
    changedById: string,
  ) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });

    if (!member || member.removedAt) {
      throw new NotFoundException('Member not found');
    }

    const oldRole = member.role;

    await this.prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { role: newRole },
    });

    await this.cache.del(`assertMembership:${organizationId}:${userId}`);

    await this.auditService.log({
      userId: changedById,
      organizationId,
      action: AuditAction.ORG_MEMBER_ROLE_CHANGED,
      entity: 'Organization',
      entityId: organizationId,
      oldValues: { userId, role: oldRole },
      newValues: { userId, role: newRole },
    });

    return { message: 'Member role updated' };
  }

  /**
   * Tenant isolation check — verify a user is a member of an organization.
   * Throws ForbiddenException if not.
   * Cached for 60 seconds to eliminate repeated queries across parallel services.
   */
  async assertMembership(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const cacheKey = `assertMembership:${organizationId}:${userId}`;
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached) return;

    // SUPER_ADMIN and ADMIN bypass org checks
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    const isGlobalAdmin = user?.userRoles.some((ur) =>
      ['SUPER_ADMIN', 'ADMIN'].includes(ur.role.name),
    );

    if (isGlobalAdmin) {
      await this.cache.set(cacheKey, true, 60);
      return;
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!membership || membership.removedAt) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    await this.cache.set(cacheKey, true, 60);
  }
}

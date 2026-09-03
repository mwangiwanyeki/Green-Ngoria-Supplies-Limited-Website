import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Branch, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  buildPaginatedMeta,
  buildPagination,
} from '../../common/utils/pagination.util';
import {
  generateBranchCode,
  retryOnUniqueConstraint,
  type ReferenceDbClient,
} from '../../common/utils/generate-reference.util';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateSessionSecurityDto } from './dto/update-session-security.dto';
import { CacheService } from '../../lib/cache/cache.service';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
    private readonly cache: CacheService,
  ) {}

  // ─── Anti-IDOR primitive ───────────────────────────────────────────────────

  /**
   * THE branch-scoping primitive for the whole ERP.
   *
   * Every ERP record carries both an `organizationId` and a `branchId`. A
   * caller supplying a `branchId` in a body or query string must never be able
   * to reach a branch belonging to a different tenant, so every ERP service
   * MUST funnel a caller-supplied `branchId` through this method before using
   * it in a query or a write.
   *
   * Membership in the organization itself is enforced separately (by
   * `TenantGuard` on the `:orgId` route param and by
   * `OrganizationsService.assertMembership`); this method closes the second
   * hole — a valid member of org A pointing at a branch of org B.
   *
   * A soft-deleted branch is treated as non-existent. `NotFoundException`
   * (rather than `ForbiddenException`) is deliberate: it does not leak whether
   * the branch exists under some other tenant.
   *
   * @param db optional transaction client, so the check can be made inside the
   *           same `$transaction` as the write it guards.
   */
  async assertBranchInOrganization(
    organizationId: string,
    branchId: string,
    db: ReferenceDbClient = this.prisma,
  ): Promise<Branch> {
    const cacheKey = `assertBranchInOrg:${organizationId}:${branchId}`;
    if (db === this.prisma) {
      const cached = await this.cache.get<Branch>(cacheKey);
      if (cached) return cached;
    }

    const branch = await db.branch.findFirst({
      where: { id: branchId, organizationId, deletedAt: null },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (db === this.prisma) {
      await this.cache.set(cacheKey, branch, 60);
    }

    return branch;
  }

  /** Convenience: membership check + branch-ownership check in one call. */
  async assertBranchAccess(
    organizationId: string,
    branchId: string,
    userId: string,
  ): Promise<Branch> {
    await this.orgsService.assertMembership(organizationId, userId);
    return this.assertBranchInOrganization(organizationId, branchId);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(organizationId: string, dto: CreateBranchDto, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const branch = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const code = dto.code ?? (await generateBranchCode(tx, organizationId));

        const existing = await tx.branch.findFirst({
          where: { organizationId, code },
        });
        if (existing) {
          throw new BadRequestException(
            `Branch code "${code}" already exists in this organization`,
          );
        }

        // The first branch of an organization is the default one.
        const branchCount = await tx.branch.count({
          where: { organizationId, deletedAt: null },
        });
        const isDefault = dto.isDefault ?? branchCount === 0;

        if (isDefault) {
          await tx.branch.updateMany({
            where: { organizationId, isDefault: true },
            data: { isDefault: false },
          });
        }

        return tx.branch.create({
          data: {
            organizationId,
            code,
            name: dto.name,
            systemName: dto.systemName,
            status: dto.status,
            isDefault,
            phone: dto.phone,
            email: dto.email,
            county: dto.county,
            address: dto.address,
            postalCode: dto.postalCode,
            logoUrl: dto.logoUrl,
            currency: dto.currency,
            currencySymbol: dto.currencySymbol,
            taxRate:
              dto.taxRate === undefined
                ? undefined
                : new Prisma.Decimal(dto.taxRate),
            lowStockThreshold: dto.lowStockThreshold,
            autoLogoutEnabled: dto.autoLogoutEnabled,
            idleTimeoutMinutes: dto.idleTimeoutMinutes,
            warningCountdownSeconds: dto.warningCountdownSeconds,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_CREATED,
      entity: 'Branch',
      entityId: branch.id,
      newValues: { code: branch.code, name: branch.name },
    });
    return branch;
  }

  async findAll(
    organizationId: string,
    userId: string,
    query: QueryBranchesDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(query, 'name');

    const where: Prisma.BranchWhereInput = { organizationId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { county: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({ where, skip, take, orderBy }),
      this.prisma.branch.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, query) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    return this.assertBranchInOrganization(organizationId, id);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateBranchDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const existing = await this.assertBranchInOrganization(organizationId, id);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.branch.updateMany({
          where: { organizationId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.branch.update({
        where: { id },
        data: {
          code: dto.code,
          name: dto.name,
          systemName: dto.systemName,
          status: dto.status,
          isDefault: dto.isDefault,
          phone: dto.phone,
          email: dto.email,
          county: dto.county,
          address: dto.address,
          postalCode: dto.postalCode,
          logoUrl: dto.logoUrl,
          currency: dto.currency,
          currencySymbol: dto.currencySymbol,
          taxRate:
            dto.taxRate === undefined
              ? undefined
              : new Prisma.Decimal(dto.taxRate),
          lowStockThreshold: dto.lowStockThreshold,
          autoLogoutEnabled: dto.autoLogoutEnabled,
          idleTimeoutMinutes: dto.idleTimeoutMinutes,
          warningCountdownSeconds: dto.warningCountdownSeconds,
        },
      });
    });

    await this.cache.del(`assertBranchInOrg:${organizationId}:${id}`);

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_UPDATED,
      entity: 'Branch',
      entityId: id,
      oldValues: { name: existing.name, status: existing.status },
      newValues: { name: updated.name, status: updated.status },
    });
    return updated;
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const branch = await this.assertBranchInOrganization(organizationId, id);

    if (branch.isDefault) {
      throw new BadRequestException(
        'The default branch cannot be deleted — set another branch as default first',
      );
    }

    await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CLOSED' },
    });

    await this.cache.del(`assertBranchInOrg:${organizationId}:${id}`);

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_DELETED,
      entity: 'Branch',
      entityId: id,
      oldValues: { code: branch.code, name: branch.name },
    });
    return { id, deleted: true };
  }

  async setDefault(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.assertBranchInOrganization(organizationId, id);

    const branch = await this.prisma.$transaction(async (tx) => {
      await tx.branch.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
      return tx.branch.update({ where: { id }, data: { isDefault: true } });
    });

    await this.cache.del(`assertBranchInOrg:${organizationId}:${id}`);

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_SET_DEFAULT,
      entity: 'Branch',
      entityId: id,
      newValues: { isDefault: true },
    });
    return branch;
  }

  // ─── Settings screen ───────────────────────────────────────────────────────

  async getBusinessProfile(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    const branch = await this.assertBranchAccess(
      organizationId,
      branchId,
      userId,
    );
    return {
      id: branch.id,
      name: branch.name,
      systemName: branch.systemName,
      phone: branch.phone,
      email: branch.email,
      county: branch.county,
      address: branch.address,
      postalCode: branch.postalCode,
      logoUrl: branch.logoUrl,
    };
  }

  async updateBusinessProfile(
    organizationId: string,
    branchId: string,
    dto: UpdateBusinessProfileDto,
    userId: string,
  ) {
    await this.assertBranchAccess(organizationId, branchId, userId);

    const branch = await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        name: dto.name,
        systemName: dto.systemName,
        phone: dto.phone,
        email: dto.email,
        county: dto.county,
        address: dto.address,
        postalCode: dto.postalCode,
        logoUrl: dto.logoUrl,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_SETTINGS_UPDATED,
      entity: 'Branch',
      entityId: branchId,
      newValues: { section: 'business-profile', ...dto },
    });

    return this.getBusinessProfile(organizationId, branch.id, userId);
  }

  async getGeneralSettings(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    const branch = await this.assertBranchAccess(
      organizationId,
      branchId,
      userId,
    );
    return {
      id: branch.id,
      currency: branch.currency,
      currencySymbol: branch.currencySymbol,
      taxRate: branch.taxRate,
      lowStockThreshold: branch.lowStockThreshold,
    };
  }

  async updateGeneralSettings(
    organizationId: string,
    branchId: string,
    dto: UpdateGeneralSettingsDto,
    userId: string,
  ) {
    await this.assertBranchAccess(organizationId, branchId, userId);

    await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        currency: dto.currency,
        currencySymbol: dto.currencySymbol,
        taxRate:
          dto.taxRate === undefined
            ? undefined
            : new Prisma.Decimal(dto.taxRate),
        lowStockThreshold: dto.lowStockThreshold,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_SETTINGS_UPDATED,
      entity: 'Branch',
      entityId: branchId,
      newValues: { section: 'general', ...dto },
    });

    return this.getGeneralSettings(organizationId, branchId, userId);
  }

  async getSessionSecurity(
    organizationId: string,
    branchId: string,
    userId: string,
  ) {
    const branch = await this.assertBranchAccess(
      organizationId,
      branchId,
      userId,
    );
    return {
      id: branch.id,
      autoLogoutEnabled: branch.autoLogoutEnabled,
      idleTimeoutMinutes: branch.idleTimeoutMinutes,
      warningCountdownSeconds: branch.warningCountdownSeconds,
    };
  }

  async updateSessionSecurity(
    organizationId: string,
    branchId: string,
    dto: UpdateSessionSecurityDto,
    userId: string,
  ) {
    await this.assertBranchAccess(organizationId, branchId, userId);

    await this.prisma.branch.update({
      where: { id: branchId },
      data: {
        autoLogoutEnabled: dto.autoLogoutEnabled,
        idleTimeoutMinutes: dto.idleTimeoutMinutes,
        warningCountdownSeconds: dto.warningCountdownSeconds,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.BRANCH_SETTINGS_UPDATED,
      entity: 'Branch',
      entityId: branchId,
      newValues: { section: 'session-security', ...dto },
    });

    return this.getSessionSecurity(organizationId, branchId, userId);
  }
}

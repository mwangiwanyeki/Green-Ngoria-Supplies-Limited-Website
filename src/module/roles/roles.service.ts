import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const ROLE_INCLUDE = {
  rolePermissions: { include: { permission: true } },
  _count: { select: { userRoles: true } },
} satisfies Prisma.RoleInclude;

type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: typeof ROLE_INCLUDE;
}>;

export interface RoleView {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  permissions: {
    id: string;
    code: string;
    resource: string;
    action: string;
    description: string | null;
  }[];
  createdAt: Date;
}

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Serialisation ─────────────────────────────────────────────────────────

  private toView(role: RoleWithPermissions): RoleView {
    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissionCount: role.rolePermissions.length,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
    };
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async findAll(organizationId: string, userId: string): Promise<RoleView[]> {
    await this.orgsService.assertMembership(organizationId, userId);

    const roles = await this.prisma.role.findMany({
      include: ROLE_INCLUDE,
      orderBy: [{ isSystem: 'desc' }, { displayName: 'asc' }],
    });

    return roles.map((role) => this.toView(role));
  }

  async findById(
    organizationId: string,
    id: string,
    userId: string,
  ): Promise<RoleView> {
    await this.orgsService.assertMembership(organizationId, userId);

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE,
    });

    if (!role) throw new NotFoundException('Role not found');
    return this.toView(role);
  }

  async listPermissions(organizationId: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      select: {
        id: true,
        code: true,
        resource: true,
        action: true,
        description: true,
      },
    });
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  private async assertPermissionsExist(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) return;

    const found = await this.prisma.permission.count({
      where: { id: { in: permissionIds } },
    });

    if (found !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs do not exist');
    }
  }

  async create(
    organizationId: string,
    dto: CreateRoleDto,
    createdById: string,
  ): Promise<RoleView> {
    await this.orgsService.assertMembership(organizationId, createdById);

    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    const permissionIds = dto.permissionIds ?? [];
    await this.assertPermissionsExist(permissionIds);

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        // Roles created through this API are never built-in.
        isSystem: false,
        rolePermissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: ROLE_INCLUDE,
    });

    await this.auditService.log({
      userId: createdById,
      organizationId,
      action: AuditAction.ROLE_CREATED,
      entity: 'Role',
      entityId: role.id,
      newValues: {
        name: role.name,
        displayName: role.displayName,
        permissionIds,
      },
    });

    return this.toView(role);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateRoleDto,
    updatedById: string,
  ): Promise<RoleView> {
    await this.orgsService.assertMembership(organizationId, updatedById);

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: ROLE_INCLUDE,
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystem) {
      throw new BadRequestException(
        `"${role.displayName}" is a built-in system role and cannot be modified`,
      );
    }

    if (dto.permissionIds) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    const oldPermissionIds = role.rolePermissions.map((rp) => rp.permissionId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.role.update({
        where: { id },
        data: {
          displayName: dto.displayName,
          description: dto.description,
        },
        include: ROLE_INCLUDE,
      });
    });

    await this.auditService.log({
      userId: updatedById,
      organizationId,
      action: AuditAction.ROLE_UPDATED,
      entity: 'Role',
      entityId: id,
      oldValues: {
        displayName: role.displayName,
        description: role.description,
        permissionIds: oldPermissionIds,
      },
      newValues: {
        displayName: updated.displayName,
        description: updated.description,
        permissionIds: dto.permissionIds ?? oldPermissionIds,
      },
    });

    return this.toView(updated);
  }

  async remove(organizationId: string, id: string, deletedById: string) {
    await this.orgsService.assertMembership(organizationId, deletedById);

    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystem) {
      throw new BadRequestException(
        `"${role.displayName}" is a built-in system role and cannot be deleted`,
      );
    }

    if (role._count.userRoles > 0) {
      throw new ConflictException(
        `Cannot delete "${role.displayName}" — ${role._count.userRoles} user(s) are still assigned this role. Reassign them first.`,
      );
    }

    // Roles carry no soft-delete column; RolePermission cascades on delete.
    await this.prisma.role.delete({ where: { id } });

    await this.auditService.log({
      userId: deletedById,
      organizationId,
      action: AuditAction.ROLE_DELETED,
      entity: 'Role',
      entityId: id,
      oldValues: { name: role.name, displayName: role.displayName },
    });

    return { message: `Role "${role.displayName}" deleted` };
  }
}

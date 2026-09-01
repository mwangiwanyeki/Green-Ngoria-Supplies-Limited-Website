import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Fields never returned in API responses
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  status: true,
  emailVerifiedAt: true,
  mfaEnabled: true,
  lastLoginAt: true,
  lastLoginIp: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: { select: { name: true, displayName: true } },
    },
  },
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, createdById: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(), // Admin-created users are pre-verified
        },
      });

      // Assign roles
      if (dto.roles?.length) {
        const rolesToAssign = await tx.role.findMany({
          where: { name: { in: dto.roles } },
        });
        await tx.userRole.createMany({
          data: rolesToAssign.map((r) => ({
            userId: newUser.id,
            roleId: r.id,
            grantedBy: createdById,
          })),
        });
      }

      return newUser;
    });

    await this.auditService.log({
      userId: createdById,
      action: AuditAction.USER_CREATED,
      entity: 'User',
      entityId: user.id,
      newValues: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    return this.findById(user.id);
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { firstName: { contains: pagination.search, mode: 'insensitive' } },
        { lastName: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: users, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });

    await this.auditService.log({
      userId: updatedById,
      action: AuditAction.USER_UPDATED,
      entity: 'User',
      entityId: id,
      oldValues: { firstName: user.firstName, lastName: user.lastName },
      newValues: dto as Record<string, unknown>,
    });

    return updated;
  }

  async deactivate(id: string, deactivatedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await this.auditService.log({
      userId: deactivatedById,
      action: AuditAction.USER_DEACTIVATED,
      entity: 'User',
      entityId: id,
    });

    return { message: 'User deactivated' };
  }

  async activate(id: string, activatedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    await this.auditService.log({
      userId: activatedById,
      action: AuditAction.USER_ACTIVATED,
      entity: 'User',
      entityId: id,
    });

    return { message: 'User activated' };
  }

  // ─── RBAC ──────────────────────────────────────────────────────────────────

  async assignRole(
    userId: string,
    roleName: SystemRole,
    grantedById: string,
    grantedByRoles: SystemRole[] = [],
  ) {
    // Privilege-escalation guard: only a SUPER_ADMIN may mint another
    // SUPER_ADMIN. Without this an ADMIN could grant SUPER_ADMIN to their own
    // account and escalate to the highest privilege level.
    if (
      roleName === SystemRole.SUPER_ADMIN &&
      !grantedByRoles.includes(SystemRole.SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'Only a SUPER_ADMIN may assign the SUPER_ADMIN role',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (existing) {
      throw new ConflictException(`User already has role ${roleName}`);
    }

    await this.prisma.userRole.create({
      data: { userId, roleId: role.id, grantedBy: grantedById },
    });

    await this.auditService.log({
      userId: grantedById,
      action: AuditAction.ROLE_ASSIGNED,
      entity: 'User',
      entityId: userId,
      newValues: { role: roleName },
    });

    return { message: `Role ${roleName} assigned` };
  }

  async removeRole(
    userId: string,
    roleName: SystemRole,
    removedById: string,
    removedByRoles: SystemRole[] = [],
  ) {
    // Symmetric guard: only a SUPER_ADMIN may strip a SUPER_ADMIN role,
    // preventing a lower-privileged ADMIN from demoting/locking out the top
    // administrators.
    if (
      roleName === SystemRole.SUPER_ADMIN &&
      !removedByRoles.includes(SystemRole.SUPER_ADMIN)
    ) {
      throw new ForbiddenException(
        'Only a SUPER_ADMIN may remove the SUPER_ADMIN role',
      );
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: role.id } },
    });
    if (!existing) {
      throw new BadRequestException(`User does not have role ${roleName}`);
    }

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: role.id } },
    });

    await this.auditService.log({
      userId: removedById,
      action: AuditAction.ROLE_REMOVED,
      entity: 'User',
      entityId: userId,
      oldValues: { role: roleName },
    });

    return { message: `Role ${roleName} removed` };
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    return [
      ...new Set(
        userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ] as string[];
  }

  async getAuditHistory(
    userId: string,
    requesterId: string,
    requesterRoles: string[],
  ) {
    // Users can view their own history; admins can view any user's history
    const isSelf = userId === requesterId;
    const isAdmin = requesterRoles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN'].includes(r),
    );

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException('Insufficient privileges');
    }

    return this.auditService.getEntityHistory('User', userId);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditContext } from './audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an audit event. Audit logs are append-only — never update or delete.
   * Failures are logged but not propagated to avoid blocking business operations.
   */
  async log(context: AuditContext): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: context.organizationId,
          userId: context.userId,
          action: context.action,
          entity: context.entity,
          entityId: context.entityId,
          oldValues: context.oldValues
            ? JSON.stringify(context.oldValues)
            : undefined,
          newValues: context.newValues
            ? JSON.stringify(context.newValues)
            : undefined,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: context.metadata
            ? JSON.stringify(context.metadata)
            : undefined,
        },
      });
    } catch (error) {
      // Audit failures must NEVER block the business operation
      // but must be surfaced to ops via the logger
      this.logger.error(
        `Audit log failed: ${context.action} on ${context.entity} by ${context.userId}`,
        error,
      );
    }
  }

  /**
   * Convenience method for logging an authentication event.
   */
  async logAuth(
    action: AuditContext['action'],
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId,
      action,
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Log a state transition (status change on a business entity).
   */
  async logStateTransition(
    context: Omit<AuditContext, 'action'> & {
      action: AuditContext['action'];
      fromState: string;
      toState: string;
    },
  ): Promise<void> {
    await this.log({
      ...context,
      metadata: {
        ...context.metadata,
        fromState: context.fromState,
        toState: context.toState,
      },
    });
  }

  /**
   * Query audit logs for an entity (used in entity history views).
   */
  async getEntityHistory(
    entity: string,
    entityId: string,
    organizationId?: string,
    limit = 50,
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        oldValues: true,
        newValues: true,
        ipAddress: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}

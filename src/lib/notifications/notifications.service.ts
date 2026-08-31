import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queue/queue.constants';
import {
  CreateNotificationDto,
  NotificationChannel,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue | null,
  ) {}

  /**
   * Create a notification and dispatch it to the configured channels.
   * Persists the in-app record always; enqueues email delivery if Redis is available.
   */
  async create(dto: CreateNotificationDto): Promise<void> {
    const channels = dto.channels ?? [NotificationChannel.IN_APP];

    try {
      // Always persist the in-app notification record
      if (channels.includes(NotificationChannel.IN_APP)) {
        await this.prisma.notification.create({
          data: {
            userId: dto.userId,
            organizationId: dto.organizationId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            entityType: dto.entityType,
            entityId: dto.entityId,
            actionUrl: dto.actionUrl,
            metadata: dto.metadata
              ? (dto.metadata as Prisma.InputJsonValue)
              : undefined,
          },
        });
      }

      // Enqueue for additional delivery channels only if Redis is available
      if (channels.length > 0 && this.notificationsQueue) {
        await this.notificationsQueue
          .add(
            NOTIFICATION_JOBS.SEND_IN_APP,
            { ...dto },
            { jobId: `notif-${dto.userId}-${Date.now()}` },
          )
          .catch((error: unknown) =>
            this.logger.warn(
              `Queue enqueue failed (Redis unavailable?): ${error instanceof Error ? error.message : 'unknown error'}`,
            ),
          );
      }
    } catch (error) {
      // Notification failures must never block business operations
      this.logger.error(
        `Failed to create notification for user ${dto.userId}: ${dto.type}`,
        error,
      );
    }
  }

  /**
   * Send a bulk notification to multiple users.
   */
  async createBulk(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    await Promise.allSettled(
      userIds.map((userId) => this.create({ ...dto, userId })),
    );
  }

  /**
   * Mark a notification as read.
   */
  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all unread notifications for a user as read.
   */
  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /**
   * Get paginated notifications for a user.
   */
  async findForUser(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

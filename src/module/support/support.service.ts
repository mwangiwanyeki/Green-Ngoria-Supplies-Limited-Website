import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { NotificationType } from '../../lib/notifications/notifications.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  generateTicketNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async createTicket(
    organizationId: string,
    dto: CreateTicketDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const ticket = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        const ticketNumber = await generateTicketNumber(tx);
        return tx.supportTicket.create({
          data: {
            organizationId,
            ticketNumber,
            clientId: dto.clientId,
            subject: dto.subject,
            description: dto.description,
            category: dto.category ?? 'GENERAL',
            status: 'OPEN',
            priority: dto.priority ?? 'MEDIUM',
            clientUserId: userId,
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.TICKET_CREATED,
      entity: 'SupportTicket',
      entityId: ticket.id,
    });

    // Notify support team
    const support = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        removedAt: null,
        role: {
          in: [
            SystemRole.CUSTOMER_CARE,
            SystemRole.ADMIN,
            SystemRole.SUPER_ADMIN,
          ],
        },
      },
      select: { userId: true },
    });
    await this.notificationsService.createBulk(
      support.map((s) => s.userId),
      {
        organizationId,
        type: NotificationType.SUPPORT_TICKET_CREATED,
        title: `New support ticket: ${ticket.ticketNumber}`,
        message: ticket.subject,
        entityType: 'SupportTicket',
        entityId: ticket.id,
      },
    );

    return ticket;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.SupportTicketWhereInput = { organizationId };
    if (pagination.search) {
      where.OR = [
        { subject: { contains: pagination.search, mode: 'insensitive' } },
        { ticketNumber: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          clientUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, organizationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        attachments: true,
        clientUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async addMessage(
    organizationId: string,
    ticketId: string,
    message: string,
    isInternal: boolean,
    userId: string,
  ) {
    await this.findById(organizationId, ticketId, userId);
    return this.prisma.ticketMessage.create({
      data: { ticketId, authorId: userId, message, isInternal },
    });
  }

  async assign(
    organizationId: string,
    ticketId: string,
    assignedToId: string,
    userId: string,
  ) {
    await this.findById(organizationId, ticketId, userId);
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId, status: 'IN_PROGRESS' },
    });
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.TICKET_ASSIGNED,
      entity: 'SupportTicket',
      entityId: ticketId,
    });
    return updated;
  }

  async resolve(
    organizationId: string,
    ticketId: string,
    resolution: string,
    userId: string,
  ) {
    await this.findById(organizationId, ticketId, userId);
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolution },
    });
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.TICKET_RESOLVED,
      entity: 'SupportTicket',
      entityId: ticketId,
    });
    return updated;
  }
}

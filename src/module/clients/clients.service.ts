import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import {
  generateClientNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';


@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateClientDto,
    createdById: string,
  ) {
    await this.orgsService.assertMembership(organizationId, createdById);

    // `clientNumber` is `@unique`, so the number is drawn from the shared
    // ReferenceSequence table (same pattern as projects/RFQs/quotations)
    // rather than an in-process counter, which collided after every restart.
    let clientNumber = '';
    const client = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        clientNumber = await generateClientNumber(tx);
        return tx.client.create({
          data: {
            organizationId,
            clientNumber,
            companyName: dto.companyName,
            industry: dto.industry,
            country: dto.country ?? 'Kenya',
            city: dto.city,
            address: dto.address,
            website: dto.website,
            email: dto.email,
            phone: dto.phone,
            miningInterest: dto.miningInterest,
            notes: dto.notes,
          },
        });
      }),
    );

    await this.auditService.log({
      userId: createdById,
      organizationId,
      action: AuditAction.CLIENT_CREATED,
      entity: 'Client',
      entityId: client.id,
      newValues: { companyName: client.companyName, clientNumber },
    });

    return client;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);

    const where: Prisma.ClientWhereInput = { organizationId, deletedAt: null };
    if (pagination.search) {
      where.OR = [
        { companyName: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { clientNumber: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          contacts: { where: { deletedAt: null, isPrimary: true }, take: 1 },
          _count: { select: { projects: true, quotations: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const client = await this.prisma.client.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        contacts: {
          where: { deletedAt: null },
          orderBy: { isPrimary: 'desc' },
        },
        _count: {
          select: {
            projects: true,
            quotations: true,
            contracts: true,
            invoices: true,
            assessments: true,
          },
        },
      },
    });

    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateClientDto,
    userId: string,
  ) {
    await this.findById(organizationId, id, userId);

    const updated = await this.prisma.client.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CLIENT_UPDATED,
      entity: 'Client',
      entityId: id,
      newValues: dto as Record<string, unknown>,
    });

    return updated;
  }

  async softDelete(organizationId: string, id: string, userId: string) {
    await this.findById(organizationId, id, userId);

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CLIENT_DELETED,
      entity: 'Client',
      entityId: id,
    });

    return { message: 'Client archived' };
  }

  // ─── Contacts ──────────────────────────────────────────────────────────────

  async addContact(
    organizationId: string,
    clientId: string,
    dto: CreateContactDto,
    userId: string,
  ) {
    await this.findById(organizationId, clientId, userId);

    // Only one primary contact per client
    if (dto.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    return this.prisma.clientContact.create({
      data: { clientId, ...dto },
    });
  }

  async updateContact(
    organizationId: string,
    clientId: string,
    contactId: string,
    dto: Partial<CreateContactDto>,
    userId: string,
  ) {
    await this.findById(organizationId, clientId, userId);

    const contact = await this.prisma.clientContact.findFirst({
      where: { id: contactId, clientId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    if (dto.isPrimary) {
      await this.prisma.clientContact.updateMany({
        where: { clientId, deletedAt: null, id: { not: contactId } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.clientContact.update({
      where: { id: contactId },
      data: dto,
    });
  }

  async removeContact(
    organizationId: string,
    clientId: string,
    contactId: string,
    userId: string,
  ) {
    await this.findById(organizationId, clientId, userId);

    await this.prisma.clientContact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Contact removed' };
  }

  async getAuditHistory(
    organizationId: string,
    clientId: string,
    userId: string,
  ) {
    await this.findById(organizationId, clientId, userId);
    return this.auditService.getEntityHistory(
      'Client',
      clientId,
      organizationId,
    );
  }
}

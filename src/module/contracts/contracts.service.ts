import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateContractDto } from './dto/create-contract.dto';

const CONTRACT_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['UNDER_REVIEW', 'APPROVED'],
  UNDER_REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['SIGNED'],
  SIGNED: ['ACTIVE'],
  ACTIVE: ['COMPLETED', 'TERMINATED'],
  COMPLETED: [],
  TERMINATED: [],
  DISPUTED: ['ACTIVE'],
};

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(organizationId: string, dto: CreateContractDto, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const contract = await this.prisma.contract.create({
      data: {
        organizationId,
        clientId: dto.clientId,
        projectId: dto.projectId,
        contractNumber: dto.contractNumber,
        title: dto.title,
        description: dto.description,
        status: 'DRAFT',
        currency: dto.currency ?? 'USD',
        value: dto.value,
        retentionPct: dto.retentionPct ?? 10,
        paymentTerms: dto.paymentTerms,
        startDate: dto.startDate,
        endDate: dto.endDate,
        approvedById: dto.approverId,
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CONTRACT_CREATED,
      entity: 'Contract',
      entityId: contract.id,
    });
    return contract;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.ContractWhereInput = {
      organizationId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { client: { select: { id: true, companyName: true } } },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const contract = await this.prisma.contract.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        milestones: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async transition(
    organizationId: string,
    id: string,
    toStatus: ContractStatus,
    userId: string,
    userRoles: string[],
  ) {
    const contract = await this.findById(organizationId, id, userId);
    const allowed = CONTRACT_TRANSITIONS[contract.status] ?? [];
    if (!allowed.includes(toStatus))
      throw new BadRequestException(
        `Cannot transition from ${contract.status} to ${toStatus}`,
      );

    if (toStatus === 'APPROVED') {
      const canApprove = [
        'SUPER_ADMIN',
        'ADMIN',
        'MANAGING_DIRECTOR',
        'DIRECTOR',
        'LEGAL_OFFICER',
      ];
      if (!userRoles.some((r) => canApprove.includes(r)))
        throw new ForbiddenException('Not authorised to approve contracts');
    }

    const updates: Prisma.ContractUncheckedUpdateInput = { status: toStatus };
    if (toStatus === 'APPROVED') {
      updates.approvedById = userId;
      updates.approvedAt = new Date();
    }
    if (toStatus === 'SIGNED') updates.signedAt = new Date();

    const updated = await this.prisma.contract.update({
      where: { id },
      data: updates,
    });
    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.CONTRACT_APPROVED,
      entity: 'Contract',
      entityId: id,
      newValues: { status: toStatus },
    });
    return updated;
  }
}

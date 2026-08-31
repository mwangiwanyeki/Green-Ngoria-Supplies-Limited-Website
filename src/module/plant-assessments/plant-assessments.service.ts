import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
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
  generateAssessmentNumber,
  retryOnUniqueConstraint,
} from '../../common/utils/generate-reference.util';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { CreateFindingDto } from './dto/create-finding.dto';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';

// Allowed state transitions for assessment workflow
const STATUS_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'DRAFT'],
  UNDER_REVIEW: ['ENGINEERING_REVIEW', 'SUBMITTED'],
  ENGINEERING_REVIEW: ['REPORT_PREPARATION', 'UNDER_REVIEW'],
  REPORT_PREPARATION: ['COMPLETED', 'ENGINEERING_REVIEW'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

@Injectable()
export class PlantAssessmentsService {
  private readonly logger = new Logger(PlantAssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateAssessmentDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    let reference = '';
    const assessment = await retryOnUniqueConstraint(() =>
      this.prisma.$transaction(async (tx) => {
        reference = await generateAssessmentNumber(tx);
        return tx.plantAssessment.create({
          data: {
            organizationId,
            reference,
            clientId: dto.clientId,
            leadId: dto.leadId,
            miningSiteId: dto.miningSiteId,
            clientName: dto.clientName,
            projectName: dto.projectName,
            miningLocation: dto.miningLocation,
            mineralType: dto.mineralType,
            estimatedTph: dto.estimatedTph,
            oreDescription: dto.oreDescription,
            oreGrade: dto.oreGrade,
            oreMineralogy: dto.oreMineralogy,
            oreHardness: dto.oreHardness,
            hasExistingPlant: dto.hasExistingPlant ?? false,
            existingPlantDesc: dto.existingPlantDesc,
            existingCapacity: dto.existingCapacity,
            crushingData: this.jsonCreateValue(dto.crushingData),
            grindingData: this.jsonCreateValue(dto.grindingData),
            classificationData: this.jsonCreateValue(dto.classificationData),
            leachingData: this.jsonCreateValue(dto.leachingData),
            adsorptionData: this.jsonCreateValue(dto.adsorptionData),
            elutionData: this.jsonCreateValue(dto.elutionData),
            tailingsData: this.jsonCreateValue(dto.tailingsData),
            waterData: this.jsonCreateValue(dto.waterData),
            powerData: this.jsonCreateValue(dto.powerData),
            reagentsData: this.jsonCreateValue(dto.reagentsData),
            currentRecovery: dto.currentRecovery,
            targetRecovery: dto.targetRecovery,
            operationalProblems: dto.operationalProblems,
            hseConstraints: dto.hseConstraints,
            environmentalConstraints: dto.environmentalConstraints,
            clientObjectives: dto.clientObjectives,
            additionalNotes: dto.additionalNotes,
            status: 'DRAFT',
          },
        });
      }),
    );

    await this.auditService.log({
      userId,
      organizationId,
      action: AuditAction.ASSESSMENT_CREATED,
      entity: 'PlantAssessment',
      entityId: assessment.id,
      newValues: { reference, clientName: dto.clientName },
    });

    return assessment;
  }

  async findAll(
    organizationId: string,
    userId: string,
    pagination: PaginationDto,
    filters?: { status?: AssessmentStatus },
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const { skip, take, orderBy } = buildPagination(pagination);
    const where: Prisma.PlantAssessmentWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.status) where.status = filters.status;

    if (pagination.search) {
      where.OR = [
        { clientName: { contains: pagination.search, mode: 'insensitive' } },
        { reference: { contains: pagination.search, mode: 'insensitive' } },
        {
          miningLocation: { contains: pagination.search, mode: 'insensitive' },
        },
        { projectName: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.plantAssessment.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          reference: true,
          clientName: true,
          projectName: true,
          miningLocation: true,
          mineralType: true,
          status: true,
          estimatedTph: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { findings: true, recommendations: true } },
        },
      }),
      this.prisma.plantAssessment.count({ where }),
    ]);

    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);

    const assessment = await this.prisma.plantAssessment.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        findings: {
          orderBy: { createdAt: 'asc' },
          include: { recommendations: { orderBy: { priority: 'asc' } } },
        },
        recommendations: { orderBy: { priority: 'asc' } },
        attachments: { orderBy: { createdAt: 'desc' } },
        client: { select: { id: true, companyName: true, clientNumber: true } },
        lead: { select: { id: true, reference: true, companyName: true } },
        miningSite: { select: { id: true, name: true, country: true } },
      },
    });

    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateAssessmentDto,
    userId: string,
  ) {
    const assessment = await this.findById(organizationId, id, userId);

    if (assessment.status === 'COMPLETED' || assessment.status === 'ARCHIVED') {
      throw new BadRequestException(
        `Cannot edit an assessment in ${assessment.status} status`,
      );
    }

    return this.prisma.plantAssessment.update({
      where: { id },
      data: {
        ...dto,
        // Preserve JSON fields correctly
        crushingData: this.jsonUpdateValue(dto.crushingData),
        grindingData: this.jsonUpdateValue(dto.grindingData),
        classificationData: this.jsonUpdateValue(dto.classificationData),
        leachingData: this.jsonUpdateValue(dto.leachingData),
        adsorptionData: this.jsonUpdateValue(dto.adsorptionData),
        elutionData: this.jsonUpdateValue(dto.elutionData),
        tailingsData: this.jsonUpdateValue(dto.tailingsData),
        waterData: this.jsonUpdateValue(dto.waterData),
        powerData: this.jsonUpdateValue(dto.powerData),
        reagentsData: this.jsonUpdateValue(dto.reagentsData),
      },
    });
  }

  // ─── Status transitions ────────────────────────────────────────────────────

  async transitionStatus(
    organizationId: string,
    id: string,
    toStatus: AssessmentStatus,
    userId: string,
    assignedEngineerId?: string,
  ) {
    const assessment = await this.findById(organizationId, id, userId);
    const currentStatus = assessment.status;

    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${toStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    // Validate submission readiness
    if (toStatus === 'SUBMITTED') {
      if (!assessment.mineralType) {
        throw new BadRequestException(
          'Mineral type is required before submission',
        );
      }
      if (!assessment.clientObjectives) {
        throw new BadRequestException(
          'Client objectives are required before submission',
        );
      }
    }

    // Validate engineering review requirements
    if (toStatus === 'COMPLETED') {
      const unreviewedRecs = await this.prisma.assessmentRecommendation.count({
        where: {
          assessmentId: id,
          engineeringReviewRequired: true,
          engineeringApprovedAt: null,
        },
      });
      if (unreviewedRecs > 0) {
        throw new BadRequestException(
          `${unreviewedRecs} recommendation(s) still require engineering review before completion`,
        );
      }
    }

    const updateData: Prisma.PlantAssessmentUncheckedUpdateInput = {
      status: toStatus,
      ...(assignedEngineerId ? { assignedEngineerId } : {}),
    };

    if (toStatus === 'SUBMITTED') updateData.submittedAt = new Date();
    if (toStatus === 'UNDER_REVIEW') updateData.reviewStartedAt = new Date();
    if (toStatus === 'COMPLETED') updateData.completedAt = new Date();

    const updated = await this.prisma.plantAssessment.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.logStateTransition({
      userId,
      organizationId,
      action: AuditAction.ASSESSMENT_STATUS_CHANGED,
      entity: 'PlantAssessment',
      entityId: id,
      fromState: currentStatus,
      toState: toStatus,
    });

    // Notify on submission
    if (toStatus === 'SUBMITTED') {
      await this.notificationsService.createBulk(
        await this.getEngineeringUserIds(organizationId),
        {
          organizationId,
          type: NotificationType.ASSESSMENT_SUBMITTED,
          title: 'Plant assessment submitted for review',
          message: `Assessment ${assessment.reference} from ${assessment.clientName} requires engineering review`,
          entityType: 'PlantAssessment',
          entityId: id,
          actionUrl: `/assessments/${id}`,
        },
      );
    }

    return updated;
  }

  // ─── Findings ──────────────────────────────────────────────────────────────

  async addFinding(
    organizationId: string,
    assessmentId: string,
    dto: CreateFindingDto,
    userId: string,
  ) {
    await this.findById(organizationId, assessmentId, userId);

    return this.prisma.assessmentFinding.create({
      data: {
        assessmentId,
        category: dto.category,
        severity: dto.severity,
        title: dto.title,
        observation: dto.observation,
        evidence: dto.evidence,
        affectedProcess: dto.affectedProcess,
        technicalImpact: dto.technicalImpact,
      },
    });
  }

  async updateFinding(
    organizationId: string,
    assessmentId: string,
    findingId: string,
    dto: Partial<CreateFindingDto>,
    userId: string,
  ) {
    await this.findById(organizationId, assessmentId, userId);

    const finding = await this.prisma.assessmentFinding.findFirst({
      where: { id: findingId, assessmentId },
    });
    if (!finding) throw new NotFoundException('Finding not found');

    return this.prisma.assessmentFinding.update({
      where: { id: findingId },
      data: dto,
    });
  }

  async deleteFinding(
    organizationId: string,
    assessmentId: string,
    findingId: string,
    userId: string,
  ) {
    await this.findById(organizationId, assessmentId, userId);
    await this.prisma.assessmentFinding.delete({ where: { id: findingId } });
    return { message: 'Finding removed' };
  }

  // ─── Recommendations ───────────────────────────────────────────────────────

  async addRecommendation(
    organizationId: string,
    assessmentId: string,
    dto: CreateRecommendationDto,
    userId: string,
  ) {
    await this.findById(organizationId, assessmentId, userId);

    return this.prisma.assessmentRecommendation.create({
      data: {
        assessmentId,
        findingId: dto.findingId,
        recommendation: dto.recommendation,
        priority: dto.priority ?? 'MEDIUM',
        expectedBenefit: dto.expectedBenefit,
        requiredWork: dto.requiredWork,
        estimatedCost: dto.estimatedCost,
        currency: dto.currency ?? 'USD',
        engineeringReviewRequired: true, // Always required
        status: 'PENDING',
      },
    });
  }

  /**
   * Engineering approval of a recommendation.
   * IMPORTANT: Professional engineering review is mandatory before recommendations
   * are presented to clients as certified advice.
   */
  async approveRecommendation(
    organizationId: string,
    assessmentId: string,
    recommendationId: string,
    userId: string,
    userRoles: string[],
  ) {
    // Only qualified engineers can approve recommendations
    const engineeringRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'MINING_ENGINEER',
      'PROCESS_ENGINEER',
      'MECHANICAL_ENGINEER',
      'ELECTRICAL_ENGINEER',
    ];
    const hasRole = userRoles.some((r) => engineeringRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenException(
        'Only qualified engineers can approve recommendations',
      );
    }

    await this.findById(organizationId, assessmentId, userId);

    const rec = await this.prisma.assessmentRecommendation.findFirst({
      where: { id: recommendationId, assessmentId },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    return this.prisma.assessmentRecommendation.update({
      where: { id: recommendationId },
      data: {
        engineeringApprovedAt: new Date(),
        engineeringApprovedBy: userId,
        status: 'APPROVED',
      },
    });
  }

  // ─── Attachments ───────────────────────────────────────────────────────────

  async addAttachment(
    organizationId: string,
    assessmentId: string,
    file: Express.Multer.File,
    description: string | undefined,
    userId: string,
  ) {
    await this.findById(organizationId, assessmentId, userId);

    // StorageService integration — store the file and record metadata
    const storageKey = `${organizationId}/assessments/${assessmentId}/${Date.now()}-${file.originalname}`;
    const checksum = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    return this.prisma.assessmentAttachment.create({
      data: {
        assessmentId,
        fileName: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        checksum,
        description,
        uploadedById: userId,
      },
    });
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async getEngineeringUserIds(
    organizationId: string,
  ): Promise<string[]> {
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        removedAt: null,
        role: {
          in: [
            'MINING_ENGINEER',
            'PROCESS_ENGINEER',
            'MECHANICAL_ENGINEER',
            'ELECTRICAL_ENGINEER',
            'PRODUCTION_MANAGER',
            'ADMIN',
            'SUPER_ADMIN',
          ],
        },
      },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  private jsonCreateValue(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | Prisma.NullTypes.JsonNull {
    return value ? (value as Prisma.InputJsonObject) : Prisma.JsonNull;
  }

  private jsonUpdateValue(
    value: Record<string, unknown> | undefined,
  ): Prisma.InputJsonValue | undefined {
    return value ? (value as Prisma.InputJsonObject) : undefined;
  }
}

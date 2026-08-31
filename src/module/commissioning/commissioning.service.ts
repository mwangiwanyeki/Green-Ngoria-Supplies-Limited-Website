import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommissioningTestResult,
  CommissioningTestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { NotificationsService } from '../../lib/notifications/notifications.service';
import { NotificationType } from '../../lib/notifications/notifications.types';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateCommissioningSystemDto,
  CreateCommissioningTestDto,
} from './dto/create-commissioning-system.dto';

@Injectable()
export class CommissioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly orgsService: OrganizationsService,
  ) {}

  // ─── Systems ───────────────────────────────────────────────────────────────

  async createSystem(
    organizationId: string,
    dto: CreateCommissioningSystemDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.assertProjectAccess(organizationId, dto.projectId);
    return this.prisma.commissioningSystem.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findSystemsByProject(
    organizationId: string,
    projectId: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    return this.prisma.commissioningSystem.findMany({
      where: { projectId, project: { organizationId } },
      orderBy: { sortOrder: 'asc' },
      include: {
        tests: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            testNumber: true,
            title: true,
            status: true,
            result: true,
          },
        },
        _count: { select: { tests: true } },
      },
    });
  }

  // ─── Tests ─────────────────────────────────────────────────────────────────

  async addTest(
    organizationId: string,
    systemId: string,
    dto: CreateCommissioningTestDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const system = await this.prisma.commissioningSystem.findFirst({
      where: { id: systemId, project: { organizationId } },
      select: { id: true },
    });
    if (!system) throw new NotFoundException('Commissioning system not found');
    return this.prisma.commissioningTest.create({
      data: {
        systemId,
        testNumber: dto.testNumber,
        title: dto.title,
        description: dto.description,
        procedure: dto.procedure,
        acceptanceCriteria: dto.acceptanceCriteria,
        status: 'PRE_CHECK',
        result: 'PENDING',
        evidence: [],
      },
    });
  }

  async recordTestResult(
    organizationId: string,
    testId: string,
    result: CommissioningTestResult,
    readings: Record<string, unknown> | undefined,
    findings: string | undefined,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const test = await this.prisma.commissioningTest.findFirst({
      where: { id: testId, system: { project: { organizationId } } },
    });
    if (!test) throw new NotFoundException('Test not found');

    const newStatus: CommissioningTestStatus =
      result === 'PASSED' ? 'PASSED' : result === 'FAILED' ? 'FAILED' : 'TEST';

    const updated = await this.prisma.commissioningTest.update({
      where: { id: testId },
      data: {
        result,
        status: newStatus,
        findings,
        readings: readings
          ? (readings as Prisma.InputJsonObject)
          : Prisma.JsonNull,
        testedById: userId,
        testedAt: new Date(),
        retestRequired: result === 'FAILED',
      },
    });

    await this.auditService.log({
      userId,
      organizationId,
      action:
        result === 'PASSED'
          ? AuditAction.COMMISSIONING_TEST_PASSED
          : AuditAction.COMMISSIONING_TEST_FAILED,
      entity: 'CommissioningTest',
      entityId: testId,
      newValues: { result, testNumber: test.testNumber },
    });

    // Notify on failure
    if (result === 'FAILED') {
      const system = await this.prisma.commissioningSystem.findUnique({
        where: { id: test.systemId },
        include: {
          project: { select: { managerId: true, organizationId: true } },
        },
      });
      if (system?.project?.managerId) {
        await this.notificationsService.create({
          userId: system.project.managerId,
          organizationId: system.project.organizationId,
          type: NotificationType.COMMISSIONING_TEST_FAILED,
          title: `Commissioning test FAILED: ${test.testNumber}`,
          message: test.title,
          entityType: 'CommissioningTest',
          entityId: testId,
        });
      }
    }

    return updated;
  }

  async approveTest(
    organizationId: string,
    testId: string,
    userId: string,
    userRoles: string[],
  ) {
    const approvalRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'MINING_ENGINEER',
      'PROCESS_ENGINEER',
      'PRODUCTION_MANAGER',
    ];
    if (!userRoles.some((r) => approvalRoles.includes(r))) {
      throw new BadRequestException(
        'Only qualified engineers can approve commissioning tests',
      );
    }

    await this.orgsService.assertMembership(organizationId, userId);
    const test = await this.prisma.commissioningTest.findFirst({
      where: { id: testId, system: { project: { organizationId } } },
    });
    if (!test) throw new NotFoundException('Test not found');

    if (test.result !== 'PASSED') {
      throw new BadRequestException('Only PASSED tests can be approved');
    }

    return this.prisma.commissioningTest.update({
      where: { id: testId },
      data: {
        status: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });
  }

  async getProjectProgress(
    organizationId: string,
    projectId: string,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);

    const systems = await this.prisma.commissioningSystem.findMany({
      where: { projectId, project: { organizationId } },
      include: { tests: { select: { result: true, status: true } } },
    });

    const allTests = systems.flatMap((s) => s.tests);
    const total = allTests.length;
    const passed = allTests.filter((t) => t.result === 'PASSED').length;
    const failed = allTests.filter((t) => t.result === 'FAILED').length;
    const approved = allTests.filter((t) => t.status === 'APPROVED').length;
    const pending = allTests.filter((t) => t.result === 'PENDING').length;

    return {
      systems: systems.length,
      total,
      passed,
      failed,
      approved,
      pending,
      completionPct: total > 0 ? Math.round((approved / total) * 100) : 0,
      canHandover: total > 0 && failed === 0 && approved === total,
    };
  }

  private async assertProjectAccess(
    organizationId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
  }
}

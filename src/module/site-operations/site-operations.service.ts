import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  buildPagination,
  buildPaginatedMeta,
} from '../../common/utils/pagination.util';
import { CreateSiteReportDto } from './dto/create-site-report.dto';

@Injectable()
export class SiteOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async createReport(
    organizationId: string,
    dto: CreateSiteReportDto,
    userId: string,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    await this.assertProjectAccess(organizationId, dto.projectId);
    return this.prisma.siteReport.create({
      data: {
        projectId: dto.projectId,
        reportDate: dto.reportDate,
        preparedById: userId,
        weather: dto.weather,
        workAreas: dto.workAreas,
        laborCount: dto.laborCount,
        activities: dto.activities,
        progress: dto.progress,
        materials: dto.materials,
        equipment: dto.equipment,
        issues: dto.issues,
        nextDayPlan: dto.nextDayPlan,
        photos: [],
      },
    });
  }

  async findAllReports(
    organizationId: string,
    userId: string,
    projectId: string,
    pagination: PaginationDto,
  ) {
    await this.orgsService.assertMembership(organizationId, userId);
    const { skip, take, orderBy } = buildPagination(pagination);
    const where = { projectId, project: { organizationId } };
    const [items, total] = await Promise.all([
      this.prisma.siteReport.findMany({ where, skip, take, orderBy }),
      this.prisma.siteReport.count({ where }),
    ]);
    return { items, meta: buildPaginatedMeta(total, pagination) };
  }

  async findReportById(organizationId: string, id: string, userId: string) {
    await this.orgsService.assertMembership(organizationId, userId);
    const report = await this.prisma.siteReport.findFirst({
      where: { id, project: { organizationId } },
    });
    if (!report) throw new NotFoundException('Site report not found');
    return report;
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

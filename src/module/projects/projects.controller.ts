import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateRiskDto } from './dto/create-risk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGING_DIRECTOR',
    'DIRECTOR',
    'PROJECT_MANAGER',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Project created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List projects' })
  @ApiQuery({ name: 'status', enum: ProjectStatus, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(ProjectStatus, { optional: true }))
    status: ProjectStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, pagination, {
      status,
    });
    return paginatedResponse(result.items, result.meta);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Project portfolio dashboard — counts and total value',
  })
  async getDashboard(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.getDashboard(orgId, actor.id));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project with milestones, tasks, risks and counts',
  })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'Update project details' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Project updated',
    );
  }

  @Post(':id/transition')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'PROJECT_MANAGER',
    'MANAGING_DIRECTOR',
    'DIRECTOR',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance project lifecycle status' })
  async transition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProjectStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transition(orgId, id, status, actor.id),
      `Project moved to ${status}`,
    );
  }

  // ─── Milestones ────────────────────────────────────────────────────────────

  @Post(':id/milestones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a milestone to a project' })
  async addMilestone(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMilestoneDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addMilestone(orgId, id, dto, actor.id),
      'Milestone added',
    );
  }

  @Patch(':id/milestones/:msId')
  @ApiOperation({ summary: 'Update a milestone' })
  async updateMilestone(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('msId', ParseUUIDPipe) msId: string,
    @Body() dto: CreateMilestoneDto & { status?: MilestoneStatus },
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateMilestone(orgId, id, msId, dto, actor.id),
    );
  }

  @Post(':id/milestones/:msId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a milestone as completed' })
  async completeMilestone(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('msId', ParseUUIDPipe) msId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.completeMilestone(orgId, id, msId, actor.id),
      'Milestone completed',
    );
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  @Post(':id/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a task to a project' })
  async addTask(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addTask(orgId, id, dto, actor.id),
      'Task added',
    );
  }

  @Patch(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Update a task (including status change)' })
  async updateTask(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateTaskDto & { status?: string },
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateTask(orgId, id, taskId, dto, actor.id),
    );
  }

  // ─── Risks ─────────────────────────────────────────────────────────────────

  @Post(':id/risks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a project risk' })
  async addRisk(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRiskDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addRisk(orgId, id, dto, actor.id),
      'Risk logged',
    );
  }

  @Patch(':id/risks/:riskId')
  @ApiOperation({ summary: 'Update a risk (status, mitigation)' })
  async updateRisk(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('riskId', ParseUUIDPipe) riskId: string,
    @Body() dto: CreateRiskDto & { status?: string },
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateRisk(orgId, id, riskId, dto, actor.id),
    );
  }
}

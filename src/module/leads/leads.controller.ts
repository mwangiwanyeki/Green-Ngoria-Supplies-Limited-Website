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
import { LeadStatus } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Leads & CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'CRM_OFFICER',
    'MANAGING_DIRECTOR',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lead' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateLeadDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const lead = await this.leadsService.create(orgId, dto, actor.id);
    return successResponse(lead, 'Lead created');
  }

  @Get()
  @ApiOperation({ summary: 'List leads (with optional status/owner filter)' })
  @ApiQuery({ name: 'status', enum: LeadStatus, required: false })
  @ApiQuery({ name: 'ownerId', required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(LeadStatus, { optional: true }))
    status: LeadStatus,
    @Query('ownerId') ownerId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.leadsService.findAll(
      orgId,
      actor.id,
      pagination,
      {
        status,
        ownerId,
      },
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get pipeline summary counts and estimated value' })
  async getPipeline(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const summary = await this.leadsService.getPipelineSummary(orgId, actor.id);
    return successResponse(summary);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const lead = await this.leadsService.findById(orgId, id, actor.id);
    return successResponse(lead);
  }

  @Patch(':id')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'CRM_OFFICER',
    'MANAGING_DIRECTOR',
  )
  @ApiOperation({ summary: 'Update lead or advance pipeline status' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const lead = await this.leadsService.update(orgId, id, dto, actor.id);
    return successResponse(lead, 'Lead updated');
  }

  // ─── Activities ────────────────────────────────────────────────────────────

  @Post(':id/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a CRM activity on a lead' })
  async addActivity(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const activity = await this.leadsService.addActivity(
      orgId,
      id,
      dto,
      actor.id,
    );
    return successResponse(activity, 'Activity logged');
  }

  @Patch(':id/activities/:activityId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a CRM activity as completed' })
  async completeActivity(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
    @Body('outcome') outcome: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.leadsService.completeActivity(
      orgId,
      id,
      activityId,
      outcome,
      actor.id,
    );
    return successResponse(result);
  }

  // ─── Consultations ─────────────────────────────────────────────────────────

  @Post(':id/consultations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a consultation on a lead' })
  async addConsultation(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateConsultationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const consultation = await this.leadsService.addConsultation(
      orgId,
      id,
      dto,
      actor.id,
    );
    return successResponse(consultation, 'Consultation scheduled');
  }
}

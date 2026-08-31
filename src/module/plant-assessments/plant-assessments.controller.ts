import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AssessmentStatus } from '@prisma/client';
import { PlantAssessmentsService } from './plant-assessments.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { CreateFindingDto } from './dto/create-finding.dto';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
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

@ApiTags('Plant Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/plant-assessments')
export class PlantAssessmentsController {
  constructor(private readonly service: PlantAssessmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a Technical Plant Assessment',
    description:
      'Initiates a structured technical assessment of a client mining plant or proposed facility. ' +
      'All recommendations generated require professional engineering review before being ' +
      'presented as certified engineering advice.',
  })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const assessment = await this.service.create(orgId, dto, actor.id);
    return successResponse(assessment, 'Assessment created');
  }

  @Get()
  @ApiOperation({ summary: 'List plant assessments' })
  @ApiQuery({ name: 'status', enum: AssessmentStatus, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(AssessmentStatus, { optional: true }))
    status: AssessmentStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, pagination, {
      status,
    });
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get full assessment details including findings and recommendations',
  })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const assessment = await this.service.findById(orgId, id, actor.id);
    return successResponse(assessment);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update assessment data (only DRAFT or UNDER_REVIEW)',
  })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const assessment = await this.service.update(orgId, id, dto, actor.id);
    return successResponse(assessment, 'Assessment updated');
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit assessment for engineering review' })
  async submit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.transitionStatus(
      orgId,
      id,
      'SUBMITTED',
      actor.id,
    );
    return successResponse(result, 'Assessment submitted for review');
  }

  @Post(':id/transition')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'PRODUCTION_MANAGER',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition assessment status (engineering team)' })
  async transition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: AssessmentStatus,
    @Body('assignedEngineerId') assignedEngineerId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.transitionStatus(
      orgId,
      id,
      status,
      actor.id,
      assignedEngineerId,
    );
    return successResponse(result, `Assessment status updated to ${status}`);
  }

  // ─── Findings ──────────────────────────────────────────────────────────────

  @Post(':id/findings')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
    'PRODUCTION_MANAGER',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a technical finding to the assessment' })
  async addFinding(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFindingDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const finding = await this.service.addFinding(orgId, id, dto, actor.id);
    return successResponse(finding, 'Finding recorded');
  }

  @Patch(':id/findings/:findingId')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
  )
  @ApiOperation({ summary: 'Update a finding' })
  async updateFinding(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('findingId', ParseUUIDPipe) findingId: string,
    @Body() dto: CreateFindingDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const finding = await this.service.updateFinding(
      orgId,
      id,
      findingId,
      dto,
      actor.id,
    );
    return successResponse(finding, 'Finding updated');
  }

  @Delete(':id/findings/:findingId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MINING_ENGINEER', 'PROCESS_ENGINEER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a finding' })
  async deleteFinding(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('findingId', ParseUUIDPipe) findingId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.deleteFinding(
      orgId,
      id,
      findingId,
      actor.id,
    );
    return successResponse(result);
  }

  // ─── Recommendations ───────────────────────────────────────────────────────

  @Post(':id/recommendations')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an engineering recommendation',
    description:
      'IMPORTANT: Recommendations are subject to professional engineering review. ' +
      'They must not be presented to clients as certified engineering advice until ' +
      'approved via POST .../recommendations/:recId/approve',
  })
  async addRecommendation(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRecommendationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const rec = await this.service.addRecommendation(orgId, id, dto, actor.id);
    return successResponse(
      rec,
      'Recommendation added (pending engineering review)',
    );
  }

  @Post(':id/recommendations/:recId/approve')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Engineering approval of a recommendation (qualified engineers only)',
  })
  async approveRecommendation(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recId', ParseUUIDPipe) recId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const rec = await this.service.approveRecommendation(
      orgId,
      id,
      recId,
      actor.id,
      actor.roles,
    );
    return successResponse(rec, 'Recommendation approved by engineer');
  }

  // ─── Attachments ───────────────────────────────────────────────────────────

  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload supporting document or photo to assessment',
  })
  async uploadAttachment(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description: string,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!file) throw new Error('File is required');
    const attachment = await this.service.addAttachment(
      orgId,
      id,
      file,
      description,
      actor.id,
    );
    return successResponse(attachment, 'Attachment uploaded');
  }
}

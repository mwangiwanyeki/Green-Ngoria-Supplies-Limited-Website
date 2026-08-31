import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiteOperationsService } from './site-operations.service';
import { CreateSiteReportDto } from './dto/create-site-report.dto';
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

@ApiTags('Site Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/site-operations')
export class SiteOperationsController {
  constructor(private readonly service: SiteOperationsService) {}

  @Post('reports')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SITE_SUPERVISOR',
    'PROJECT_MANAGER',
    'HSE_OFFICER',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a daily site report' })
  async createReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateSiteReportDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createReport(orgId, dto, actor.id),
      'Report submitted',
    );
  }

  @Get('reports')
  @ApiOperation({ summary: 'List site reports for a project' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllReports(
      orgId,
      actor.id,
      projectId,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get a site report by ID' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findReportById(orgId, id, actor.id),
    );
  }
}

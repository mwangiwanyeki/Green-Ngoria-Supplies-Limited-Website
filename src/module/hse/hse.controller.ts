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
import { HseService } from './hse.service';
import { CreateHseIncidentDto } from './dto/create-hse-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('HSE')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/hse')
export class HseController {
  constructor(private readonly service: HseService) {}

  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report an HSE incident' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateHseIncidentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createIncident(orgId, dto, actor.id),
      'Incident reported',
    );
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List HSE incidents' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('projectId') projectId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllIncidents(
      orgId,
      actor.id,
      pagination,
      projectId,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get HSE incident details' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findIncidentById(orgId, id, actor.id),
    );
  }

  @Post('incidents/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close an HSE incident' })
  async close(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.closeIncident(orgId, id, actor.id),
      'Incident closed',
    );
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'HSE dashboard summary' })
  async dashboard(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.getDashboard(orgId, actor.id));
  }
}

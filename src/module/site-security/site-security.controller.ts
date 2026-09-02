import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { SiteSecurityService } from './site-security.service';
import { CreateSecurityLogDto } from './dto/create-security-log.dto';
import { UpdateSecurityLogDto } from './dto/update-security-log.dto';
import { ResolveSecurityLogDto } from './dto/resolve-security-log.dto';
import { QuerySecurityLogsDto } from './dto/query-security-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  paginatedResponse,
  successResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

const SECURITY_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
  'HSE_OFFICER',
  'SITE_SUPERVISOR',
] as const;

@ApiTags('ERP — Site Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/security-logs')
export class SiteSecurityController {
  constructor(private readonly service: SiteSecurityService) {}

  @Post()
  @Roles(...SECURITY_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a site security event' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateSecurityLogDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Security log created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List security logs for a branch' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QuerySecurityLogsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('stats')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({ summary: 'Security log counts by severity and status' })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getStats(orgId, branchId, actor.id),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a security log' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Patch(':id')
  @Roles(...SECURITY_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a security log' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSecurityLogDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Security log updated',
    );
  }

  @Post(':id/resolve')
  @Roles(...SECURITY_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve or close a security log' })
  async resolve(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveSecurityLogDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.resolve(orgId, id, dto, actor.id),
      'Security log resolved',
    );
  }

  @Delete(':id')
  @Roles(...SECURITY_WRITE_ROLES)
  @ApiOperation({ summary: 'Soft-delete a security log' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.remove(orgId, id, actor.id),
      'Security log deleted',
    );
  }
}

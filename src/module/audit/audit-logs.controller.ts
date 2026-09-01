import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

/**
 * Audit logs are append-only and system-written — this controller is read-only
 * by design. Entries are produced by `AuditService.log()` from feature modules.
 */
@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR', 'LEGAL_OFFICER')
@Controller('organizations/:orgId/audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List audit log entries with filters and pagination',
  })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryAuditLogsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.auditLogsService.findAll(
      orgId,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('facets')
  @ApiOperation({
    summary: 'Distinct action and entity values, for building filter controls',
  })
  async facets(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const facets = await this.auditLogsService.getFilterFacets(
      orgId,
      actor.id,
    );
    return successResponse(facets);
  }
}

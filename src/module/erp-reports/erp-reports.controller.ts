import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErpReportsService } from './erp-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';
import { QueryReportsOverviewDto } from './dto/query-reports-overview.dto';

@ApiTags('ERP Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/reports')
export class ErpReportsController {
  constructor(private readonly service: ErpReportsService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Cross-module financial overview: revenue, expenses, stock, debt, ' +
      'headcount and a trailing monthly revenue/expense trend',
  })
  async overview(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryReportsOverviewDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getOverview(orgId, actor.id, query),
    );
  }
}

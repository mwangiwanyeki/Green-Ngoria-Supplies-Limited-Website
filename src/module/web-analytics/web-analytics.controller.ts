import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebAnalyticsService } from './web-analytics.service';
import { TrackPageViewDto } from './dto/track-page-view.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';
import { ArcjetSkip } from '../../lib/arcjet/arcjet.guard';

@ApiTags('Web Analytics')
@Controller()
export class WebAnalyticsController {
  constructor(private readonly service: WebAnalyticsService) {}

  /**
   * Public, unauthenticated beacon. The marketing site posts one of these per
   * page view. Arcjet is skipped so bot-detection/rate-limits don't drop
   * legitimate high-frequency analytics beacons; the service itself is
   * fail-soft and stores only derived geo (never the raw IP).
   */
  @Post('public/track')
  @Public()
  @ArcjetSkip()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Record a website page view (public beacon)' })
  async track(@Body() dto: TrackPageViewDto, @Req() req: Request): Promise<void> {
    await this.service.track(dto, req);
  }

  /**
   * Admin analytics overview. Org-scoped for RBAC; the data itself is the
   * whole public site's traffic.
   */
  @Get('organizations/:orgId/web-analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'DIRECTOR',
    'MANAGING_DIRECTOR',
    'SALES_MANAGER',
    'CRM_OFFICER',
    'CUSTOMER_CARE',
  )
  @ApiOperation({ summary: 'Aggregated website traffic analytics' })
  async overview(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('days') days: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const parsed = Math.min(Math.max(parseInt(days ?? '30', 10) || 30, 1), 365);
    return successResponse(
      await this.service.getOverview(orgId, actor.id, parsed),
    );
  }
}

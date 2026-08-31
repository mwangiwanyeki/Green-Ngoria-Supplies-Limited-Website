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
import { VisitorsService } from './visitors.service';
import { RegisterVisitorDto } from './dto/register-visitor.dto';
import { CheckOutVisitorDto } from './dto/check-out-visitor.dto';
import { QueryVisitorsDto } from './dto/query-visitors.dto';
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

const VISITOR_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'HSE_OFFICER',
  'SITE_SUPERVISOR',
  'CUSTOMER_CARE',
] as const;

const VISITOR_DELETE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
] as const;

@ApiTags('ERP — Visitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/visitors')
export class VisitorsController {
  constructor(private readonly service: VisitorsService) {}

  @Post()
  @Roles(...VISITOR_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a visitor (badge number auto-generated)' })
  async register(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: RegisterVisitorDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.register(orgId, dto, actor.id),
      'Visitor registered',
    );
  }

  @Get('stats')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({
    summary: "Currently checked-in and today's visitors counters",
  })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getStats(orgId, branchId, actor.id),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List visitors for a branch' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryVisitorsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a visitor' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Patch(':id/check-out')
  @Roles(...VISITOR_WRITE_ROLES)
  @ApiOperation({ summary: 'Check a visitor out' })
  async checkOut(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CheckOutVisitorDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.checkOut(orgId, id, dto, actor.id),
      'Visitor checked out',
    );
  }

  @Delete(':id')
  @Roles(...VISITOR_DELETE_ROLES)
  @ApiOperation({ summary: 'Soft-delete a visitor' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.remove(orgId, id, actor.id),
      'Visitor deleted',
    );
  }
}

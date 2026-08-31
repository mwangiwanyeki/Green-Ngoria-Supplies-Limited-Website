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
import { HrService } from './hr.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
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

const HR_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
] as const;

const HR_DELETE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
] as const;

@ApiTags('ERP — HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  // ─── Overview ─────────────────────────────────────────────────────────────

  @Get('overview')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({ summary: 'HR overview counters for a branch' })
  async overview(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getOverview(orgId, branchId, actor.id),
    );
  }

  // ─── Staff ────────────────────────────────────────────────────────────────

  @Post('staff')
  @Roles(...HR_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a staff member' })
  async createStaff(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateStaffDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createStaff(orgId, dto, actor.id),
      'Staff member created',
    );
  }

  @Get('staff')
  @ApiOperation({ summary: 'List staff for a branch' })
  async findAllStaff(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryStaffDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllStaff(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('branches/:branchId/staff/:id')
  @ApiOperation({ summary: 'Get a staff member' })
  async findStaff(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findStaffById(orgId, branchId, id, actor.id),
    );
  }

  @Patch('branches/:branchId/staff/:id')
  @Roles(...HR_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a staff member' })
  async updateStaff(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateStaff(orgId, branchId, id, dto, actor.id),
      'Staff member updated',
    );
  }

  @Delete('branches/:branchId/staff/:id')
  @Roles(...HR_DELETE_ROLES)
  @ApiOperation({ summary: 'Terminate (soft-delete) a staff member' })
  async removeStaff(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.removeStaff(orgId, branchId, id, actor.id),
      'Staff member terminated',
    );
  }
}

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
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { QueryLeaveRequestsDto } from './dto/query-leave-requests.dto';
import { QueryPayrollRunsDto } from './dto/query-payroll-runs.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
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

  // ─── Payroll runs ──────────────────────────────────────────────────────────

  @Get('payroll')
  @ApiOperation({ summary: 'List payroll runs for a branch' })
  async findPayrollRuns(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryPayrollRunsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findPayrollRuns(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post('payroll')
  @Roles(...HR_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Create a DRAFT payroll run for the given month/year/branch. ' +
      'Aggregates all ACTIVE staff at the branch into staffCount and ' +
      'seeds totalGross from their baseSalary; approval, entries and ' +
      'payment happen through subsequent updates.',
  })
  async createPayrollRun(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreatePayrollRunDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createPayrollRun(orgId, dto, actor.id),
      'Payroll run drafted',
    );
  }

  // ─── Leave requests ────────────────────────────────────────────────────────

  @Get('leave')
  @ApiOperation({ summary: 'List leave requests for a branch' })
  async findLeaveRequests(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryLeaveRequestsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findLeaveRequests(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post('leave')
  @Roles(...HR_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a leave request for a staff member' })
  async createLeaveRequest(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateLeaveRequestDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createLeaveRequest(orgId, dto, actor.id),
      'Leave request submitted',
    );
  }

  @Post('leave/:id/review')
  @Roles(...HR_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or deny a leave request' })
  async reviewLeaveRequest(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: 'APPROVED' | 'DENIED',
    @Body('comments') comments: string | undefined,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.reviewLeaveRequest(
        orgId,
        id,
        status,
        actor.id,
        comments,
      ),
      `Leave request ${status.toLowerCase()}`,
    );
  }
}

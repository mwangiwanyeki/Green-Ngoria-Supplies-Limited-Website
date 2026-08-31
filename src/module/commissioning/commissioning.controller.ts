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
import { CommissioningTestResult } from '@prisma/client';
import { CommissioningService } from './commissioning.service';
import {
  CreateCommissioningSystemDto,
  CreateCommissioningTestDto,
} from './dto/create-commissioning-system.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Commissioning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/commissioning')
export class CommissioningController {
  constructor(private readonly service: CommissioningService) {}

  @Post('systems')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a commissioning system' })
  async createSystem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateCommissioningSystemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createSystem(orgId, dto, actor.id),
      'System created',
    );
  }

  @Get('systems')
  @ApiOperation({
    summary: 'Get commissioning systems and tests for a project',
  })
  async findSystems(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findSystemsByProject(orgId, projectId, actor.id),
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Commissioning progress summary for a project' })
  async progress(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getProjectProgress(orgId, projectId, actor.id),
    );
  }

  @Post('systems/:systemId/tests')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
    'SITE_SUPERVISOR',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a commissioning test to a system' })
  async addTest(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('systemId', ParseUUIDPipe) systemId: string,
    @Body() dto: CreateCommissioningTestDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addTest(orgId, systemId, dto, actor.id),
      'Test added',
    );
  }

  @Post('tests/:testId/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Record commissioning test result (PASSED / FAILED / CONDITIONAL_PASS)',
  })
  async recordResult(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @Body('result') result: CommissioningTestResult,
    @Body('readings') readings: Record<string, unknown>,
    @Body('findings') findings: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.recordTestResult(
        orgId,
        testId,
        result,
        readings,
        findings,
        actor.id,
      ),
    );
  }

  @Post('tests/:testId/approve')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'PRODUCTION_MANAGER',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a passed commissioning test (engineers only)',
  })
  async approveTest(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.approveTest(
        orgId,
        testId,
        actor.id,
        actor.roles as string[],
      ),
      'Test approved',
    );
  }
}

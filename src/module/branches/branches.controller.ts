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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdateSessionSecurityDto } from './dto/update-session-security.dto';
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

const BRANCH_ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
] as const;

@ApiTags('ERP — Branches & Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}

  @Post()
  @Roles(...BRANCH_ADMIN_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a branch' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateBranchDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Branch created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List branches for the caller organization' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryBranchesDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a branch' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Patch(':id')
  @Roles(...BRANCH_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update a branch' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Branch updated',
    );
  }

  @Delete(':id')
  @Roles(...BRANCH_ADMIN_ROLES)
  @ApiOperation({ summary: 'Soft-delete a branch' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.remove(orgId, id, actor.id),
      'Branch deleted',
    );
  }

  @Post(':id/set-default')
  @Roles(...BRANCH_ADMIN_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make this the default branch' })
  async setDefault(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.setDefault(orgId, id, actor.id),
      'Default branch updated',
    );
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  @Get(':id/settings/business-profile')
  @ApiOperation({ summary: 'Settings → Business Profile' })
  async getBusinessProfile(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getBusinessProfile(orgId, id, actor.id),
    );
  }

  @Patch(':id/settings/business-profile')
  @Roles(...BRANCH_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update Settings → Business Profile' })
  async updateBusinessProfile(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessProfileDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateBusinessProfile(orgId, id, dto, actor.id),
      'Business profile updated',
    );
  }

  @Get(':id/settings/general')
  @ApiOperation({ summary: 'Settings → General' })
  async getGeneralSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getGeneralSettings(orgId, id, actor.id),
    );
  }

  @Patch(':id/settings/general')
  @Roles(...BRANCH_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update Settings → General' })
  async updateGeneralSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGeneralSettingsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateGeneralSettings(orgId, id, dto, actor.id),
      'General settings updated',
    );
  }

  @Get(':id/settings/session-security')
  @ApiOperation({ summary: 'Settings → Session Security' })
  async getSessionSecurity(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getSessionSecurity(orgId, id, actor.id),
    );
  }

  @Patch(':id/settings/session-security')
  @Roles(...BRANCH_ADMIN_ROLES)
  @ApiOperation({ summary: 'Update Settings → Session Security' })
  async updateSessionSecurity(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionSecurityDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateSessionSecurity(orgId, id, dto, actor.id),
      'Session security updated',
    );
  }
}

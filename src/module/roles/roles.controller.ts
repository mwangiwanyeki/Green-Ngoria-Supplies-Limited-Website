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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { successResponse } from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // ─── Permissions catalogue ─────────────────────────────────────────────────

  @Get('permissions')
  @ApiOperation({
    summary: 'List every permission available for building a role',
  })
  async listPermissions(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const permissions = await this.rolesService.listPermissions(
      orgId,
      actor.id,
    );
    return successResponse(permissions);
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  @Get('roles')
  @ApiOperation({ summary: 'List roles with their granted permissions' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const roles = await this.rolesService.findAll(orgId, actor.id);
    return successResponse(roles);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get a single role with its permissions' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const role = await this.rolesService.findById(orgId, id, actor.id);
    return successResponse(role);
  }

  @Post('roles')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a custom (non-system) role',
    description:
      'Built-in SystemRole records are seeded and immutable — this endpoint only creates custom roles. Restricted to Super Admin.',
  })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const role = await this.rolesService.create(orgId, dto, actor.id);
    return successResponse(role, 'Role created');
  }

  @Patch('roles/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: "Update a custom role's display name, description or permissions (Super Admin only)",
  })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const role = await this.rolesService.update(orgId, id, dto, actor.id);
    return successResponse(role, 'Role updated');
  }

  @Delete('roles/:id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom role that has no assigned users (Super Admin only)' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.rolesService.remove(orgId, id, actor.id);
    return successResponse(result, result.message);
  }
}

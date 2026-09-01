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
import { SystemRole } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser) {
    const user = await this.usersService.create(dto, actor.id);
    return successResponse(user, 'User created successfully');
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'List all users (paginated)' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.usersService.findAll(pagination);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  async getMyProfile(@CurrentUser() actor: AuthUser) {
    const user = await this.usersService.findById(actor.id);
    return successResponse(user);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    return successResponse(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile' })
  async updateMyProfile(
    @CurrentUser() actor: AuthUser,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(actor.id, dto, actor.id);
    return successResponse(user, 'Profile updated');
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update a user (admin only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const user = await this.usersService.update(id, dto, actor.id);
    return successResponse(user, 'User updated');
  }

  @Post(':id/deactivate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user account' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.usersService.deactivate(id, actor.id);
    return successResponse(result);
  }

  @Post(':id/activate')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a deactivated user account' })
  async activate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.usersService.activate(id, actor.id);
    return successResponse(result);
  }

  // ─── RBAC ──────────────────────────────────────────────────────────────────

  @Post(':id/roles')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a role to a user' })
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.usersService.assignRole(
      id,
      dto.role,
      actor.id,
      actor.roles,
    );
    return successResponse(result);
  }

  @Delete(':id/roles/:role')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a role from a user' })
  async removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('role') role: SystemRole,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.usersService.removeRole(
      id,
      role,
      actor.id,
      actor.roles,
    );
    return successResponse(result);
  }

  @Get(':id/permissions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all permissions for a user' })
  async getPermissions(@Param('id', ParseUUIDPipe) id: string) {
    const permissions = await this.usersService.getUserPermissions(id);
    return successResponse(permissions);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit history for a user' })
  async getAuditHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const history = await this.usersService.getAuditHistory(
      id,
      actor.id,
      actor.roles,
    );
    return successResponse(history);
  }
}

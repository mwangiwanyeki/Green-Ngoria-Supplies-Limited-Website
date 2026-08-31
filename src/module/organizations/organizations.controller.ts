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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddMemberDto } from './dto/add-member.dto';
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

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization' })
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const org = await this.orgsService.create(dto, actor.id);
    return successResponse(org, 'Organization created');
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'List all organizations (paginated)' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.orgsService.findAll(pagination);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.orgsService.assertMembership(id, actor.id);
    const org = await this.orgsService.findById(id);
    return successResponse(org);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update organization details' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const org = await this.orgsService.update(id, dto, actor.id);
    return successResponse(org, 'Organization updated');
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of an organization' })
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    await this.orgsService.assertMembership(id, actor.id);
    const result = await this.orgsService.getMembers(id, pagination);
    return paginatedResponse(result.items, result.meta);
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a user to an organization' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.orgsService.addMember(id, dto, actor.id);
    return successResponse(result);
  }

  @Delete(':id/members/:userId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a user from an organization' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.orgsService.removeMember(id, userId, actor.id);
    return successResponse(result);
  }

  @Patch(':id/members/:userId/role')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change a member role within an organization' })
  async changeMemberRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('role') role: SystemRole,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.orgsService.changeMemberRole(
      id,
      userId,
      role,
      actor.id,
    );
    return successResponse(result);
  }
}

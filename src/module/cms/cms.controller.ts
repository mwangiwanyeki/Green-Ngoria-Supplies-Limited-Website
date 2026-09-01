import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { CmsService } from './cms.service';
import { CreateCmsContentDto } from './dto/create-cms-content.dto';
import { UpdateCmsContentDto } from './dto/update-cms-content.dto';
import { PublishCmsContentDto } from './dto/publish-cms-content.dto';
import { ParseCmsTypePipe } from './parse-cms-type.pipe';
import { CMS_CONTENT_TYPES, type CmsContentType } from './cms.types';
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

const CONTENT_EDITORS = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
] as const;

@ApiTags('CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiParam({ name: 'type', enum: CMS_CONTENT_TYPES })
@Controller('organizations/:orgId/cms/:type')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @ApiOperation({ summary: 'List CMS content of a given type' })
  @ApiQuery({ name: 'status', enum: ContentStatus, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(ContentStatus, { optional: true }))
    status: ContentStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.cmsService.findAll(
      orgId,
      type,
      actor.id,
      pagination,
      { status },
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CMS entry including its body content' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const item = await this.cmsService.findById(orgId, type, id, actor.id);
    return successResponse(item);
  }

  @Post()
  @Roles(...CONTENT_EDITORS)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a CMS entry' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Body() dto: CreateCmsContentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const item = await this.cmsService.create(orgId, type, dto, actor.id);
    return successResponse(item, 'Content created');
  }

  @Patch(':id')
  @Roles(...CONTENT_EDITORS)
  @ApiOperation({ summary: 'Update a CMS entry' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCmsContentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const item = await this.cmsService.update(orgId, type, id, dto, actor.id);
    return successResponse(item, 'Content updated');
  }

  @Patch(':id/status')
  @Roles(...CONTENT_EDITORS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish, unpublish or archive a CMS entry',
  })
  async setStatus(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishCmsContentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const item = await this.cmsService.setStatus(
      orgId,
      type,
      id,
      dto.status,
      actor.id,
    );
    return successResponse(item, `Content moved to ${dto.status}`);
  }

  @Delete(':id')
  @Roles(...CONTENT_EDITORS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a CMS entry' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('type', ParseCmsTypePipe) type: CmsContentType,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.cmsService.remove(orgId, type, id, actor.id);
    return successResponse(result, result.message);
  }
}

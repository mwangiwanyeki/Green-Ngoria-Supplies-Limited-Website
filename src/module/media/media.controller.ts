import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MULTER_FILE_LIMITS } from '../../common/constants/upload.constants';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
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

const MEDIA_EDITORS = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'PROJECT_MANAGER',
] as const;

@ApiTags('Media Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @Roles(...MEDIA_EDITORS)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', MULTER_FILE_LIMITS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media asset to the organization library' })
  async upload(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: UploadMediaDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!file) throw new BadRequestException('A file is required');
    const asset = await this.mediaService.upload(orgId, dto, file, actor.id);
    return successResponse(asset, 'Media uploaded');
  }

  @Get()
  @ApiOperation({ summary: 'List media assets (paginated)' })
  @ApiQuery({
    name: 'mimeType',
    required: false,
    description: 'Exact MIME type ("image/png") or family ("image")',
  })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('mimeType') mimeType: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.mediaService.findAll(
      orgId,
      actor.id,
      pagination,
      { mimeType },
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one media asset with a time-limited download URL',
  })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const asset = await this.mediaService.findById(orgId, id, actor.id);
    return successResponse(asset);
  }

  @Patch(':id')
  @Roles(...MEDIA_EDITORS)
  @ApiOperation({ summary: 'Update a media asset file name or alt text' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const asset = await this.mediaService.update(orgId, id, dto, actor.id);
    return successResponse(asset, 'Media updated');
  }

  @Delete(':id')
  @Roles(...MEDIA_EDITORS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a media asset (removed from storage, row soft-deleted)',
  })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.mediaService.remove(orgId, id, actor.id);
    return successResponse(result, result.message);
  }
}

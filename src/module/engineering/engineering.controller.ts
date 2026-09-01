import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
import { DocumentStatus, DocumentType } from '@prisma/client';
import { EngineeringService } from './engineering.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Engineering Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/engineering/documents')
export class EngineeringController {
  constructor(private readonly service: EngineeringService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', MULTER_FILE_LIMITS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a new controlled engineering document',
    description:
      'Documents enter the DRAFT state and must pass through UNDER_REVIEW → REVIEWED → APPROVED. ' +
      'Controlled documents are never overwritten — revisions create audit records.',
  })
  async upload(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!file) throw new Error('File is required');
    return successResponse(
      await this.service.upload(orgId, dto, file, actor.id),
      'Document uploaded',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List engineering documents' })
  @ApiQuery({ name: 'status', enum: DocumentStatus, required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'type', enum: DocumentType, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(DocumentStatus, { optional: true }))
    status: DocumentStatus,
    @Query('projectId') projectId: string,
    @Query('type', new ParseEnumPipe(DocumentType, { optional: true }))
    type: DocumentType,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, pagination, {
      status,
      projectId,
      type,
    });
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details and revision history' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Get a time-limited signed URL to download the document',
  })
  async download(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getDownloadUrl(orgId, id, actor.id),
    );
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transition document status through the review/approval workflow',
  })
  async transition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: DocumentStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transition(
        orgId,
        id,
        status,
        actor.id,
        actor.roles as string[],
      ),
      `Document status updated to ${status}`,
    );
  }

  @Post(':id/revise')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MINING_ENGINEER',
    'PROCESS_ENGINEER',
    'MECHANICAL_ENGINEER',
    'ELECTRICAL_ENGINEER',
  )
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', MULTER_FILE_LIMITS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a new revision of a controlled document',
    description:
      'Previous revision is archived. Document resets to DRAFT and must go through the review workflow again.',
  })
  async uploadRevision(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('revision') revision: string,
    @Body('reason') reason: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthUser,
  ) {
    if (!file) throw new Error('File is required');
    if (!revision)
      throw new Error('Revision identifier is required (e.g. REV_01)');
    return successResponse(
      await this.service.uploadRevision(
        orgId,
        id,
        revision,
        reason,
        file,
        actor.id,
      ),
      `Revision ${revision} uploaded`,
    );
  }
}

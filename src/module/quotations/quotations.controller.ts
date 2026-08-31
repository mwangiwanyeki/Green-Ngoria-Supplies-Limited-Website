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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
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

@ApiTags('Quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/quotations')
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'SALES_MANAGER',
    'CRM_OFFICER',
    'MANAGING_DIRECTOR',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new quotation' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateQuotationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Quotation created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List quotations' })
  @ApiQuery({ name: 'status', enum: QuotationStatus, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(QuotationStatus, { optional: true }))
    status: QuotationStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(
      orgId,
      actor.id,
      pagination,
      status,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation with line items, revisions' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit quotation for internal review' })
  async submit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.submitForReview(orgId, id, actor.id),
      'Quotation submitted for review',
    );
  }

  @Post(':id/approve')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGING_DIRECTOR',
    'DIRECTOR',
    'SALES_MANAGER',
    'PRODUCTION_MANAGER',
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a quotation (authorised approvers only)',
    description: 'Triggers PDF generation via background queue.',
  })
  async approve(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.approve(orgId, id, actor.id, actor.roles as string[]),
      'Quotation approved — PDF generation queued',
    );
  }

  @Post(':id/send')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send approved quotation to client' })
  async send(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.send(orgId, id, actor.id),
      'Quotation sent to client',
    );
  }

  @Post(':id/reject')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR', 'SALES_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a quotation with a reason' })
  async reject(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.reject(orgId, id, reason, actor.id),
      'Quotation rejected',
    );
  }

  @Post(':id/revise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a new revision (snapshots current, resets to DRAFT)',
  })
  async revise(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createRevision(orgId, id, reason, actor.id),
      'New revision created',
    );
  }
}

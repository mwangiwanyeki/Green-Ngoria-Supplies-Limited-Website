import {
  Body,
  Controller,
  Delete,
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
import { RfqStatus } from '@prisma/client';
import { RfqsService } from './rfqs.service';
import { CreateRfqDto, RfqItemDto } from './dto/create-rfq.dto';
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

@ApiTags('RFQs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/rfqs')
export class RfqsController {
  constructor(private readonly service: RfqsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new RFQ' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateRfqDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'RFQ created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs' })
  @ApiQuery({ name: 'status', enum: RfqStatus, required: false })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(RfqStatus, { optional: true }))
    status: RfqStatus,
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
  @ApiOperation({ summary: 'Get RFQ details' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit RFQ for review' })
  async submit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transition(orgId, id, 'SUBMITTED', actor.id),
      'RFQ submitted',
    );
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN', 'ADMIN', 'SALES_MANAGER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an RFQ' })
  async cancel(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transition(orgId, id, 'CANCELLED', actor.id),
      'RFQ cancelled',
    );
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an item to a DRAFT RFQ' })
  async addItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() item: RfqItemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addItem(orgId, id, item, actor.id),
      'Item added',
    );
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an item from a DRAFT RFQ' })
  async removeItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.removeItem(orgId, id, itemId, actor.id),
    );
  }
}

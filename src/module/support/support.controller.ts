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
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Support')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/support/tickets')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateTicketDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createTicket(orgId, dto, actor.id),
      'Ticket created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List support tickets' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, pagination);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket with messages' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.findById(orgId, id, actor.id));
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a message to a ticket' })
  async addMessage(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('message') message: string,
    @Body('isInternal') isInternal: boolean,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addMessage(
        orgId,
        id,
        message,
        isInternal ?? false,
        actor.id,
      ),
    );
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign ticket to a technician' })
  async assign(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.assign(orgId, id, assignedToId, actor.id),
    );
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark ticket as resolved' })
  async resolve(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolution') resolution: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.resolve(orgId, id, resolution, actor.id),
    );
  }
}

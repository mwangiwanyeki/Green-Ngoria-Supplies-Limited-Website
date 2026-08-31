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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateContactDto } from './dto/create-contact.dto';
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

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGING_DIRECTOR',
    'SALES_MANAGER',
    'CRM_OFFICER',
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new client' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateClientDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const client = await this.clientsService.create(orgId, dto, actor.id);
    return successResponse(client, 'Client created');
  }

  @Get()
  @ApiOperation({ summary: 'List all clients for an organization' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.clientsService.findAll(
      orgId,
      actor.id,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const client = await this.clientsService.findById(orgId, id, actor.id);
    return successResponse(client);
  }

  @Patch(':id')
  @Roles(
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGING_DIRECTOR',
    'SALES_MANAGER',
    'CRM_OFFICER',
  )
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const client = await this.clientsService.update(orgId, id, dto, actor.id);
    return successResponse(client, 'Client updated');
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a client (soft delete)' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.clientsService.softDelete(orgId, id, actor.id);
    return successResponse(result);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit history for a client' })
  async getAudit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const history = await this.clientsService.getAuditHistory(
      orgId,
      id,
      actor.id,
    );
    return successResponse(history);
  }

  // ─── Contacts ──────────────────────────────────────────────────────────────

  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a contact to a client' })
  async addContact(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContactDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const contact = await this.clientsService.addContact(
      orgId,
      id,
      dto,
      actor.id,
    );
    return successResponse(contact, 'Contact added');
  }

  @Patch(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Update a client contact' })
  async updateContact(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: CreateContactDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const contact = await this.clientsService.updateContact(
      orgId,
      id,
      contactId,
      dto,
      actor.id,
    );
    return successResponse(contact, 'Contact updated');
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a client contact' })
  async removeContact(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.clientsService.removeContact(
      orgId,
      id,
      contactId,
      actor.id,
    );
    return successResponse(result);
  }
}

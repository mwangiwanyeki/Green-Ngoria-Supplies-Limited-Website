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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { FinanceService } from './finance.service';
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
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Finance summary — invoiced, paid, outstanding' })
  async summary(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getFinanceSummary(orgId, actor.id),
    );
  }

  @Post('invoices')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an invoice' })
  async createInvoice(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createInvoice(orgId, dto, actor.id),
      'Invoice created',
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  async findInvoices(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(InvoiceStatus, { optional: true }))
    status: InvoiceStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllInvoices(
      orgId,
      actor.id,
      pagination,
      status,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  async findInvoice(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findInvoiceById(orgId, id, actor.id),
    );
  }

  @Post('invoices/:id/issue')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a draft invoice to the client' })
  async issueInvoice(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.issueInvoice(orgId, id, actor.id),
      'Invoice issued',
    );
  }

  @Post('invoices/:id/payments')
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  async recordPayment(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.recordPayment(orgId, id, dto, actor.id),
      'Payment recorded',
    );
  }
}

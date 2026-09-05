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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { VatLeachService } from './vat-leach.service';
import { CreateVatLeachUnitDto } from './dto/create-vat-leach-unit.dto';
import { UpdateVatLeachUnitDto } from './dto/update-vat-leach-unit.dto';
import { QueryVatLeachUnitsDto } from './dto/query-vat-leach-units.dto';
import { CreateVatLeachRentalDto } from './dto/create-vat-leach-rental.dto';
import { UpdateVatLeachRentalDto } from './dto/update-vat-leach-rental.dto';
import { QueryVatLeachRentalsDto } from './dto/query-vat-leach-rentals.dto';
import { RecordVatLeachPaymentDto } from './dto/record-vat-leach-payment.dto';
import { QueryVatLeachPaymentsDto } from './dto/query-vat-leach-payments.dto';
import { QueryPaymentRemindersDto } from './dto/query-payment-reminders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  paginatedResponse,
  successResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

const VAT_LEACH_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
  'SITE_SUPERVISOR',
] as const;

const VAT_LEACH_FINANCE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
  'FINANCE_OFFICER',
] as const;

@ApiTags('ERP — Vat Leach')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/vat-leach')
export class VatLeachController {
  constructor(private readonly service: VatLeachService) {}

  // ─── Units ─────────────────────────────────────────────────────────────────

  @Post('units')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a vat leach unit' })
  async createUnit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateVatLeachUnitDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createUnit(orgId, dto, actor.id),
      'Vat leach unit created',
    );
  }

  @Get('units')
  @ApiOperation({ summary: 'List vat leach units for a branch' })
  async findAllUnits(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryVatLeachUnitsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllUnits(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('units/available')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({ summary: 'List units currently available to rent out' })
  async findAvailableUnits(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findAvailableUnits(orgId, branchId, actor.id),
    );
  }

  @Get('branches/:branchId/units/:id')
  @ApiOperation({ summary: 'Get a vat leach unit' })
  async findUnit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findUnitById(orgId, branchId, id, actor.id),
    );
  }

  @Patch('branches/:branchId/units/:id')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a vat leach unit' })
  async updateUnit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVatLeachUnitDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateUnit(orgId, branchId, id, dto, actor.id),
      'Vat leach unit updated',
    );
  }

  @Delete('branches/:branchId/units/:id')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @ApiOperation({ summary: 'Soft-delete a vat leach unit' })
  async removeUnit(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.removeUnit(orgId, branchId, id, actor.id),
      'Vat leach unit deleted',
    );
  }

  // ─── Stats / tabs ──────────────────────────────────────────────────────────

  @Get('stats')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({ summary: 'Deposits held and vat leach counters' })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getStats(orgId, branchId, actor.id),
    );
  }

  @Get('reminders')
  @ApiOperation({ summary: 'Payment Reminders tab' })
  async reminders(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryPaymentRemindersDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findPaymentReminders(
      orgId,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Payment History tab' })
  async payments(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryVatLeachPaymentsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findPayments(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  // ─── Rentals ───────────────────────────────────────────────────────────────

  @Post('rentals')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a vat leach unit to a renter' })
  async createRental(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateVatLeachRentalDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createRental(orgId, dto, actor.id),
      'Rental created',
    );
  }

  @Get('rentals')
  @ApiOperation({ summary: 'List vat leach rentals for a branch' })
  async findAllRentals(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryVatLeachRentalsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllRentals(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('branches/:branchId/rentals/:id')
  @ApiOperation({ summary: 'Get a rental with its payment history' })
  async findRental(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findRentalById(orgId, branchId, id, actor.id),
    );
  }

  @Patch('branches/:branchId/rentals/:id')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a rental' })
  async updateRental(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVatLeachRentalDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateRental(orgId, branchId, id, dto, actor.id),
      'Rental updated',
    );
  }

  @Delete('branches/:branchId/rentals/:id')
  @Roles(...VAT_LEACH_WRITE_ROLES)
  @ApiOperation({ summary: 'Soft-delete (terminate) a rental' })
  async removeRental(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.removeRental(orgId, branchId, id, actor.id),
      'Rental terminated',
    );
  }

  @Post('branches/:branchId/rentals/:id/payments')
  @Roles(...VAT_LEACH_FINANCE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a rental payment' })
  async recordPayment(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordVatLeachPaymentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.recordPayment(orgId, branchId, id, dto, actor.id),
      'Payment recorded',
    );
  }

  @Get('rentals/:id/payments')
  @ApiOperation({ summary: 'Payment history for one rental' })
  async rentalPayments(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryVatLeachPaymentsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findRentalPayments(
      orgId,
      id,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }
}

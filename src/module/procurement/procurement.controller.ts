import {
  Body,
  Controller,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProcurementStatus } from '@prisma/client';
import { ProcurementService } from './procurement.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { CreateProcurementQuoteDto } from './dto/create-quote.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
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

@ApiTags('Procurement & Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

  // ─── Vendors ───────────────────────────────────────────────────────────────

  @Post('vendors')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new vendor' })
  async createVendor(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateVendorDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createVendor(orgId, dto, actor.id),
      'Vendor registered',
    );
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List vendors' })
  async findAllVendors(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllVendors(
      orgId,
      actor.id,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('vendors/:vendorId')
  @ApiOperation({ summary: 'Get vendor details with quote and PO history' })
  async findVendor(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findVendorById(orgId, vendorId, actor.id),
    );
  }

  @Post('vendors/:vendorId/approve')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a vendor for use in procurement' })
  async approveVendor(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.approveVendor(orgId, vendorId, actor.id),
      'Vendor approved',
    );
  }

  @Patch('vendors/:vendorId')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @ApiOperation({ summary: 'Update vendor details' })
  async updateVendor(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() dto: CreateVendorDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateVendor(orgId, vendorId, dto, actor.id),
      'Vendor updated',
    );
  }

  // ─── Requisitions ──────────────────────────────────────────────────────────

  @Post('requisitions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a purchase requisition' })
  async createRequisition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateRequisitionDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createRequisition(orgId, dto, actor.id),
      'Requisition created',
    );
  }

  @Get('requisitions')
  @ApiOperation({ summary: 'List requisitions' })
  @ApiQuery({ name: 'status', enum: ProcurementStatus, required: false })
  async findAllRequisitions(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @Query('status', new ParseEnumPipe(ProcurementStatus, { optional: true }))
    status: ProcurementStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllRequisitions(
      orgId,
      actor.id,
      pagination,
      status,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('requisitions/:reqId')
  @ApiOperation({ summary: 'Get requisition with items and supplier quotes' })
  async findRequisition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reqId', ParseUUIDPipe) reqId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findRequisitionById(orgId, reqId, actor.id),
    );
  }

  @Post('requisitions/:reqId/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Advance requisition through the procurement workflow',
  })
  async transitionRequisition(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reqId', ParseUUIDPipe) reqId: string,
    @Body('status') status: ProcurementStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transitionRequisition(
        orgId,
        reqId,
        status,
        actor.id,
        actor.roles as string[],
      ),
      `Requisition status updated to ${status}`,
    );
  }

  @Post('requisitions/:reqId/quotes')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a supplier quote to a requisition' })
  async addQuote(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reqId', ParseUUIDPipe) reqId: string,
    @Body() dto: CreateProcurementQuoteDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.addSupplierQuote(orgId, reqId, dto, actor.id),
      'Supplier quote recorded',
    );
  }

  @Post('requisitions/:reqId/quotes/:quoteId/select')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Select a supplier quote for the requisition' })
  async selectQuote(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('reqId', ParseUUIDPipe) reqId: string,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.selectQuote(orgId, reqId, quoteId, actor.id),
    );
  }

  // ─── Purchase orders ───────────────────────────────────────────────────────

  @Post('purchase-orders')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'MANAGING_DIRECTOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Raise a purchase order' })
  async createPo(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createPurchaseOrder(orgId, dto, actor.id),
      'Purchase order raised',
    );
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'List all purchase orders' })
  async findAllPos(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllPurchaseOrders(
      orgId,
      actor.id,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Patch('purchase-orders/:poId/status')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Update PO status (ACKNOWLEDGED | SHIPPED | DELIVERED | CANCELLED)',
  })
  async updatePoStatus(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('poId', ParseUUIDPipe) poId: string,
    @Body('status') status: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updatePoStatus(orgId, poId, status, actor.id),
      `PO status updated to ${status}`,
    );
  }
}

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
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { BranchScopeQueryDto } from '../../common/dto/branch-scope.dto';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';
import { CreateSaleDto } from './dto/create-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { VoidSaleDto } from './dto/void-sale.dto';

const SELL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
] as const;

const REVERSE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
  'FINANCE_OFFICER',
] as const;

@ApiTags('ERP Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get('today-summary')
  @ApiOperation({ summary: "Today's total, average sale and sale count" })
  async todaySummary(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getTodaySummary(orgId, actor.id, query),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List sales (date range, status and channel)' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QuerySalesDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post()
  @Roles(...SELL_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'POS checkout — creates the sale, decrements stock and bills credit ' +
      'in one transaction',
  })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateSaleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createSale(orgId, dto, actor.id),
      'Sale recorded',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale with line items and payments' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findById(orgId, id, actor.id, query.branchId),
    );
  }

  @Post(':id/void')
  @Roles(...REVERSE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void or refund a sale — reverses stock and credit atomically',
  })
  async void(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidSaleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.voidSale(orgId, id, dto, actor.id),
      dto.refund ? 'Sale refunded' : 'Sale voided',
    );
  }
}

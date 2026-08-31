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
import { ErpCustomersService } from './erp-customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  BranchScopeQueryDto,
  BranchScopedPaginationDto,
} from '../../common/dto/branch-scope.dto';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

const WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
  'CRM_OFFICER',
  'CUSTOMER_CARE',
] as const;

const DELETE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'SALES_MANAGER',
] as const;

@ApiTags('ERP Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/customers')
export class ErpCustomersController {
  constructor(private readonly service: ErpCustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List ERP customers (search by name/phone/email)' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an ERP customer' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateCustomerDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Customer created',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an ERP customer' })
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

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update an ERP customer' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Customer updated',
    );
  }

  @Delete(':id')
  @Roles(...DELETE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an ERP customer (soft delete)' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDelete(orgId, id, actor.id, query.branchId),
      'Customer archived',
    );
  }

  @Get(':id/sales')
  @ApiOperation({ summary: 'Sales history for a customer' })
  async findSales(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findSales(orgId, id, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id/debt')
  @ApiOperation({ summary: 'Debt summary for a customer' })
  async getDebt(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getDebtSummary(orgId, id, actor.id, query.branchId),
    );
  }
}

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
import { AccountsService } from './accounts.service';
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
import { CreateFinancialAccountDto } from './dto/create-financial-account.dto';
import { UpdateFinancialAccountDto } from './dto/update-financial-account.dto';
import { CreateManualEntryDto } from './dto/create-manual-entry.dto';
import { QueryAccountTransactionsDto } from './dto/query-account-transactions.dto';

const MANAGE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
] as const;

@ApiTags('ERP Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Combined balance across the branch accounts' })
  async summary(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getSummary(orgId, actor.id, query),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List financial accounts' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a financial account' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateFinancialAccountDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Account created',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a financial account' })
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
  @Roles(...MANAGE_ROLES)
  @ApiOperation({ summary: 'Update a financial account' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialAccountDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Account updated',
    );
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a financial account (soft delete)' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDelete(orgId, id, actor.id, query.branchId),
      'Account archived',
    );
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'List transactions for an account' })
  async findTransactions(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryAccountTransactionsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findTransactions(
      orgId,
      id,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Post(':id/transactions')
  @Roles(...MANAGE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Manual Entry — posts a ledger row and moves the balance atomically',
  })
  async createManualEntry(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateManualEntryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createManualEntry(orgId, id, dto, actor.id),
      'Manual entry recorded',
    );
  }
}

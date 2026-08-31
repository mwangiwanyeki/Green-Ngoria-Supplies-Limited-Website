import {
  Body,
  Controller,
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
import { DebtService } from './debt.service';
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
import { QueryDebtAccountsDto } from './dto/query-debt-accounts.dto';
import { RecordDebtPaymentDto } from './dto/record-debt-payment.dto';
import { UpdateDebtAccountDto } from './dto/update-debt-account.dto';

const COLLECT_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
  'SALES_MANAGER',
  'CUSTOMER_CARE',
] as const;

const MANAGE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
] as const;

@ApiTags('ERP Debt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/debt')
export class DebtController {
  constructor(private readonly service: DebtService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Total outstanding, overdue count and customers owing',
  })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.getStats(orgId, actor.id, query));
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List debt accounts (status filter, search)' })
  async findAccounts(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryDebtAccountsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllAccounts(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get a debt account with its payment history' })
  async findAccount(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findAccountById(orgId, id, actor.id, query.branchId),
    );
  }

  @Patch('accounts/:id')
  @Roles(...MANAGE_ROLES)
  @ApiOperation({ summary: 'Update credit limit, due date or status' })
  async updateAccount(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDebtAccountDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateAccount(orgId, id, dto, actor.id),
      'Debt account updated',
    );
  }

  @Get('accounts/:id/payments')
  @ApiOperation({ summary: 'List payments against a debt account' })
  async findPayments(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAccountPayments(
      orgId,
      id,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Post('accounts/:id/payments')
  @Roles(...COLLECT_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Record a debt payment — balance updated atomically',
  })
  async recordPayment(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordDebtPaymentDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.recordPayment(orgId, id, dto, actor.id),
      'Payment recorded',
    );
  }
}

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
import { ExpensesService } from './expenses.service';
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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { QueryExpenseStatsDto } from './dto/query-expense-stats.dto';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

const WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
  'PROCUREMENT_OFFICER',
] as const;

const DELETE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'FINANCE_OFFICER',
] as const;

@ApiTags('ERP Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Total expenses and record count' })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryExpenseStatsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.getStats(orgId, actor.id, query));
  }

  // ─── Categories ───────────────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List expense categories' })
  async findCategories(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllCategories(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post('categories')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an expense category' })
  async createCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateExpenseCategoryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createCategory(orgId, dto, actor.id),
      'Category created',
    );
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get an expense category' })
  async findCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findCategoryById(orgId, id, actor.id, query.branchId),
    );
  }

  @Patch('categories/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update an expense category' })
  async updateCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateCategory(orgId, id, dto, actor.id),
      'Category updated',
    );
  }

  @Delete('categories/:id')
  @Roles(...DELETE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an expense category (soft delete)' })
  async removeCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDeleteCategory(
        orgId,
        id,
        actor.id,
        query.branchId,
      ),
      'Category archived',
    );
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List expenses (category and date filters)' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryExpensesDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an expense (reference auto-generated)' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Expense recorded',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense' })
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
  @ApiOperation({ summary: 'Update an expense' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, id, dto, actor.id),
      'Expense updated',
    );
  }

  @Delete(':id')
  @Roles(...DELETE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an expense (soft delete)' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDelete(orgId, id, actor.id, query.branchId),
      'Expense archived',
    );
  }
}

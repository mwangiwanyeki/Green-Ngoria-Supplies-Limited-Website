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
import { InventoryService } from './inventory.service';
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
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

const WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
  'PROCUREMENT_OFFICER',
  'SITE_SUPERVISOR',
] as const;

const DELETE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
] as const;

@ApiTags('ERP Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/erp/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  // ─── Stats ────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({
    summary: 'Stock-on-hand value, in-stock and out-of-stock counts',
  })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(await this.service.getStats(orgId, actor.id, query));
  }

  // ─── Categories (declared before `items/:id` style routes) ────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List inventory categories' })
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
  @ApiOperation({ summary: 'Create an inventory category' })
  async createCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateInventoryCategoryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createCategory(orgId, dto, actor.id),
      'Category created',
    );
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get an inventory category' })
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
  @ApiOperation({ summary: 'Update an inventory category' })
  async updateCategory(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCategoryDto,
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
  @ApiOperation({ summary: 'Archive an inventory category (soft delete)' })
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

  // ─── Stores ───────────────────────────────────────────────────────────────

  @Get('stores')
  @ApiOperation({ summary: 'List stores' })
  async findStores(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllStores(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post('stores')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a store' })
  async createStore(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateStoreDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createStore(orgId, dto, actor.id),
      'Store created',
    );
  }

  @Get('stores/:id')
  @ApiOperation({ summary: 'Get a store' })
  async findStore(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findStoreById(orgId, id, actor.id, query.branchId),
    );
  }

  @Patch('stores/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a store' })
  async updateStore(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateStore(orgId, id, dto, actor.id),
      'Store updated',
    );
  }

  @Delete('stores/:id')
  @Roles(...DELETE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a store (soft delete)' })
  async removeStore(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDeleteStore(orgId, id, actor.id, query.branchId),
      'Store archived',
    );
  }

  // ─── Items ────────────────────────────────────────────────────────────────

  @Get('items')
  @ApiOperation({
    summary: 'List inventory items (search, low/out-of-stock filters)',
  })
  async findItems(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryInventoryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllItems(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Post('items')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an inventory item (SKU auto-generated)' })
  async createItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateInventoryItemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createItem(orgId, dto, actor.id),
      'Inventory item created',
    );
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get an inventory item' })
  async findItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findItemById(orgId, id, actor.id, query.branchId),
    );
  }

  @Patch('items/:id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update an inventory item' })
  async updateItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.updateItem(orgId, id, dto, actor.id),
      'Inventory item updated',
    );
  }

  @Delete('items/:id')
  @Roles(...DELETE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an inventory item (soft delete)' })
  async removeItem(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopeQueryDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.softDeleteItem(orgId, id, actor.id, query.branchId),
      'Inventory item archived',
    );
  }

  @Post('items/:id/adjust')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust stock — writes a movement and updates quantity atomically',
  })
  async adjustStock(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.adjustStock(orgId, id, dto, actor.id),
      'Stock adjusted',
    );
  }

  @Get('items/:id/movements')
  @ApiOperation({ summary: 'List stock movements for an item' })
  async findMovements(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: BranchScopedPaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findItemMovements(
      orgId,
      id,
      actor.id,
      query,
    );
    return paginatedResponse(result.items, result.meta);
  }
}

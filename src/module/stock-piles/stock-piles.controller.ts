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
import { StockPilesService } from './stock-piles.service';
import { CreateStockPileDto } from './dto/create-stock-pile.dto';
import { UpdateStockPileDto } from './dto/update-stock-pile.dto';
import { QueryStockPilesDto } from './dto/query-stock-piles.dto';
import { RecordStockPileMovementDto } from './dto/record-stock-pile-movement.dto';
import { QueryStockPileMovementsDto } from './dto/query-stock-pile-movements.dto';
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

const STOCK_PILE_WRITE_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DIRECTOR',
  'MANAGING_DIRECTOR',
  'PRODUCTION_MANAGER',
  'MINING_ENGINEER',
  'SITE_SUPERVISOR',
] as const;

@ApiTags('ERP — Stock Piles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/stock-piles')
export class StockPilesController {
  constructor(private readonly service: StockPilesService) {}

  @Post()
  @Roles(...STOCK_PILE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a stockpile' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateStockPileDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.create(orgId, dto, actor.id),
      'Stockpile created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List stockpiles for a branch' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryStockPilesDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAll(orgId, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('stats')
  @ApiQuery({ name: 'branchId', required: true })
  @ApiOperation({ summary: 'Total tonnage and pile counts by status' })
  async stats(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getStats(orgId, branchId, actor.id),
    );
  }

  @Get('branches/:branchId/:id')
  @ApiOperation({ summary: 'Get a stockpile with recent movements' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findById(orgId, branchId, id, actor.id),
    );
  }

  @Patch('branches/:branchId/:id')
  @Roles(...STOCK_PILE_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a stockpile' })
  async update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockPileDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.update(orgId, branchId, id, dto, actor.id),
      'Stockpile updated',
    );
  }

  @Delete('branches/:branchId/:id')
  @Roles(...STOCK_PILE_WRITE_ROLES)
  @ApiOperation({ summary: 'Soft-delete a depleted stockpile' })
  async remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.remove(orgId, branchId, id, actor.id),
      'Stockpile deleted',
    );
  }

  @Post('branches/:branchId/:id/movements')
  @Roles(...STOCK_PILE_WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a tonnage movement on a stockpile' })
  async recordMovement(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordStockPileMovementDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.recordMovement(orgId, branchId, id, dto, actor.id),
      'Movement recorded',
    );
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'List movements for a stockpile' })
  async findMovements(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryStockPileMovementsDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findMovements(orgId, id, actor.id, query);
    return paginatedResponse(result.items, result.meta);
  }
}

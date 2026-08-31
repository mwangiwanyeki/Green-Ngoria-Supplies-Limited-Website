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
import { WorkOrderStatus } from '@prisma/client';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';
import { AuthUser } from '../auth/auth.types';

@ApiTags('Assets & Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations/:orgId/assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a plant asset' })
  async create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateAssetDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createAsset(orgId, dto, actor.id),
      'Asset registered',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List assets' })
  async findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllAssets(
      orgId,
      actor.id,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset with maintenance history' })
  async findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.findAssetById(orgId, id, actor.id),
    );
  }

  @Post('work-orders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a maintenance work order' })
  async createWorkOrder(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createWorkOrder(orgId, dto, actor.id),
      'Work order created',
    );
  }

  @Get('work-orders/list')
  @ApiOperation({ summary: 'List all maintenance work orders' })
  async findWorkOrders(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() actor: AuthUser,
  ) {
    const result = await this.service.findAllWorkOrders(
      orgId,
      actor.id,
      pagination,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Post('work-orders/:woId/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance work order status' })
  async transitionWo(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('woId', ParseUUIDPipe) woId: string,
    @Body('status') status: WorkOrderStatus,
    @Body('completionNotes') completionNotes: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.transitionWorkOrder(
        orgId,
        woId,
        status,
        completionNotes,
        actor.id,
      ),
    );
  }

  @Post(':id/warranty')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update asset warranty' })
  async createWarranty(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWarrantyDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.createWarranty(orgId, id, dto, actor.id),
    );
  }

  @Get('warranties/expiring')
  @ApiOperation({ summary: 'List warranties expiring in the next 90 days' })
  async expiringWarranties(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() actor: AuthUser,
  ) {
    return successResponse(
      await this.service.getExpiringWarranties(orgId, actor.id),
    );
  }
}

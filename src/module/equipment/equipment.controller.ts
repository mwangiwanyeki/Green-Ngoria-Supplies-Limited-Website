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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';

@ApiTags('Equipment & Spares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly service: EquipmentService) {}

  // ─── Categories ────────────────────────────────────────────────────────────

  @Post('categories')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create an equipment category' })
  async createCategory(
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('parentId') parentId: string,
  ) {
    return successResponse(
      await this.service.createCategory(name, description, parentId),
    );
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List equipment categories (public)' })
  async findAllCategories() {
    return successResponse(await this.service.findAllCategories());
  }

  // ─── Equipment ─────────────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add equipment to catalogue' })
  async create(@Body() dto: CreateEquipmentDto) {
    return successResponse(
      await this.service.createEquipment(dto),
      'Equipment added',
    );
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published equipment (public catalogue)' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.service.findAllEquipment(pagination, true);
    return paginatedResponse(result.items, result.meta);
  }

  @Get('admin')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @ApiOperation({ summary: 'List all equipment including unpublished (admin)' })
  async findAllAdmin(@Query() pagination: PaginationDto) {
    const result = await this.service.findAllEquipment(pagination, false);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get equipment details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(await this.service.findEquipmentById(id));
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @ApiOperation({ summary: 'Update equipment' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEquipmentDto,
  ) {
    return successResponse(
      await this.service.updateEquipment(id, dto),
      'Equipment updated',
    );
  }

  @Post(':id/publish')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish equipment to the public catalogue' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(
      await this.service.publishEquipment(id),
      'Equipment published',
    );
  }

  @Post(':id/unpublish')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish equipment from the public catalogue' })
  async unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(await this.service.unpublishEquipment(id));
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive equipment (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(await this.service.deleteEquipment(id));
  }

  // ─── Spare parts ───────────────────────────────────────────────────────────

  @Post('spares')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a spare part' })
  async createSpare(@Body() dto: CreateSparePartDto) {
    return successResponse(
      await this.service.createSparePart(dto),
      'Spare part added',
    );
  }

  @Get('spares')
  @ApiOperation({ summary: 'List spare parts' })
  @ApiQuery({ name: 'equipmentId', required: false })
  async findAllSpares(
    @Query() pagination: PaginationDto,
    @Query('equipmentId') equipmentId: string,
  ) {
    const result = await this.service.findAllSpareParts(
      pagination,
      equipmentId,
    );
    return paginatedResponse(result.items, result.meta);
  }

  @Get('spares/:id')
  @ApiOperation({ summary: 'Get spare part details' })
  async findSpare(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(await this.service.findSparePartById(id));
  }

  @Patch('spares/:id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @ApiOperation({ summary: 'Update spare part' })
  async updateSpare(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSparePartDto,
  ) {
    return successResponse(
      await this.service.updateSparePart(id, dto),
      'Spare part updated',
    );
  }

  @Post('spares/:id/stock-adjust')
  @Roles('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Adjust spare part stock (positive = add, negative = remove)',
  })
  async adjustStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('adjustment') adjustment: number,
    @Body('reason') reason: string,
  ) {
    return successResponse(
      await this.service.adjustStock(id, adjustment, reason),
      'Stock adjusted',
    );
  }
}

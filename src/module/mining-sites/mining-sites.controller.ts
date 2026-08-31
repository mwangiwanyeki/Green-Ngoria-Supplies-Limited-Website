import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MiningSitesService } from './mining-sites.service';
import { CreateMiningSiteDto } from './dto/create-mining-site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import {
  successResponse,
  paginatedResponse,
} from '../../common/response/api-response';

@ApiTags('Mining Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mining-sites')
export class MiningSitesController {
  constructor(private readonly service: MiningSitesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MINING_ENGINEER', 'MANAGING_DIRECTOR')
  @ApiOperation({ summary: 'Register a new mining site' })
  async create(@Body() dto: CreateMiningSiteDto) {
    return successResponse(
      await this.service.create(dto),
      'Mining site created',
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all mining sites' })
  async findAll(@Query() pagination: PaginationDto) {
    const result = await this.service.findAll(pagination);
    return paginatedResponse(result.items, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mining site details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return successResponse(await this.service.findById(id));
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MINING_ENGINEER')
  @ApiOperation({ summary: 'Update a mining site' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMiningSiteDto,
  ) {
    return successResponse(
      await this.service.update(id, dto),
      'Mining site updated',
    );
  }
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BranchScopedPaginationDto } from '../../../common/dto/branch-scope.dto';

/** Filter chips shown above the inventory table. */
export enum InventoryStockFilter {
  ALL = 'all',
  LOW_STOCK = 'low-stock',
  OUT_OF_STOCK = 'out-of-stock',
}

export class QueryInventoryDto extends BranchScopedPaginationDto {
  @ApiPropertyOptional({
    enum: InventoryStockFilter,
    default: InventoryStockFilter.ALL,
  })
  @IsOptional()
  @IsEnum(InventoryStockFilter)
  filter?: InventoryStockFilter = InventoryStockFilter.ALL;

  @ApiPropertyOptional({ description: 'Restrict to one category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Restrict to one store' })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

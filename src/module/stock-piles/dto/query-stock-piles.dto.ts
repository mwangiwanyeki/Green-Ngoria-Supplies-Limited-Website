import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockPileStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryStockPilesDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: StockPileStatus })
  @IsOptional()
  @IsEnum(StockPileStatus)
  status?: StockPileStatus;

  @ApiPropertyOptional({ description: 'Filter by mining site' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;
}

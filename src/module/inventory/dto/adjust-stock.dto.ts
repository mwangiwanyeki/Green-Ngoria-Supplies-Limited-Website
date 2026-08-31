import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';
import { StockMovementType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({ description: 'Branch the item belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    description:
      'Signed change in quantity — positive adds stock, negative removes it',
    example: -5,
  })
  @Type(() => Number)
  @IsInt()
  @NotEquals(0)
  quantityDelta: number;

  @ApiProperty({
    enum: StockMovementType,
    default: StockMovementType.ADJUSTMENT,
  })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiPropertyOptional({ description: 'Unit cost for this movement' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Why the stock changed' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Store the movement happened in' })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

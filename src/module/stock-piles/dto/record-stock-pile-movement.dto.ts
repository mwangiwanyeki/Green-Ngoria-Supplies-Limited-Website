import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockPileMovementType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordStockPileMovementDto {
  @ApiProperty({ enum: StockPileMovementType })
  @IsEnum(StockPileMovementType)
  type: StockPileMovementType;

  @ApiProperty({
    description:
      'Tonnage moved, always a positive magnitude. The movement type decides the sign: DEPOSIT adds, WITHDRAWAL and TRANSFER subtract. For ADJUSTMENT and ASSAY_CORRECTION use `signedTonnage` instead.',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  tonnage?: number;

  @ApiPropertyOptional({
    description:
      'Explicit signed delta, required for ADJUSTMENT and ASSAY_CORRECTION movements.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  signedTonnage?: number;

  @ApiPropertyOptional({ description: 'Assayed grade for this parcel (g/t)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  grade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Defaults to now' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
}

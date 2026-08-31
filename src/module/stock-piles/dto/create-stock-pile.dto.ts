import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, MineralType, StockPileStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStockPileDto {
  @ApiProperty({ description: 'Branch the stockpile belongs to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Mining site the pile sits on' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  @ApiPropertyOptional({
    description: 'Pile code. Auto-generated (SP-YYYY-nnnn) when omitted.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Free-text ore description' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  oreType?: string;

  @ApiPropertyOptional({ enum: MineralType })
  @IsOptional()
  @IsEnum(MineralType)
  mineralType?: MineralType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    enum: StockPileStatus,
    default: StockPileStatus.ACCUMULATING,
  })
  @IsOptional()
  @IsEnum(StockPileStatus)
  status?: StockPileStatus;

  @ApiPropertyOptional({
    description: 'Opening tonnage. Recorded as an OPENING movement.',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  tonnage?: number;

  @ApiPropertyOptional({ description: 'Estimated grade (g/t)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  estimatedGrade?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

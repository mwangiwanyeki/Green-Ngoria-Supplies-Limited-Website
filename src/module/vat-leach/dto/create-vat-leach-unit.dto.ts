import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VatLeachStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateVatLeachUnitDto {
  @ApiProperty({ description: 'Branch the vat leach unit belongs to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Mining site the unit sits on' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  @ApiPropertyOptional({
    description: 'Unit code. Auto-generated (VAT-nnnn) when omitted.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Capacity in tonnes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  capacityTonnes?: number;

  @ApiPropertyOptional({ enum: VatLeachStatus, default: VatLeachStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(VatLeachStatus)
  status?: VatLeachStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

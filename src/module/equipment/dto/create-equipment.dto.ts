import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEquipmentDto {
  @ApiPropertyOptional({ description: 'Equipment category UUID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: 'CIP-TANK-50' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Carbon-in-Pulp Adsorption Tank 50m³' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'Metso Outotec' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Primary application (e.g. CIP/CIL gold processing)',
  })
  @IsOptional()
  @IsString()
  application?: string;

  @ApiPropertyOptional({
    description: 'Capacity description (e.g. 50 m³, 120 t/h)',
  })
  @IsOptional()
  @IsString()
  capacity?: string;

  @ApiPropertyOptional({ type: Number, description: 'Installed power in kW' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  powerKw?: number;

  @ApiPropertyOptional({ type: Number, description: 'Weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dimensions?: string;

  @ApiPropertyOptional({
    description: 'Technical specifications as key-value JSON',
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

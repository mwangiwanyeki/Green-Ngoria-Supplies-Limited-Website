import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class RfqItemDto {
  @ApiPropertyOptional({ description: 'Equipment UUID (if from catalogue)' })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  lineNumber: number;

  @ApiProperty({ example: 'CIP Adsorption Tank 50m³ with agitator drive' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'EA' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalSpecs?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRfqDto {
  @ApiPropertyOptional({ description: 'Client UUID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ example: 'CIP Plant Equipment Package — Phase 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  requiredByDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalRequirements?: string;

  @ApiProperty({ type: [RfqItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqItemDto)
  items: RfqItemDto[];
}

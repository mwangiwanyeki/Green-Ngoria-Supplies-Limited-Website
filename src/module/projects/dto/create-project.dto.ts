import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, MineralType, ProjectType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiPropertyOptional({ description: 'Client UUID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Mining site UUID' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  @ApiProperty({ example: 'Bondo CIP Gold Plant — Phase 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectType, default: 'MINERAL_PROCESSING' })
  @IsOptional()
  @IsEnum(ProjectType)
  type?: ProjectType;

  @ApiPropertyOptional({ enum: Currency, default: 'USD' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ type: Number, description: 'Contract value' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contractValue?: number;

  @ApiPropertyOptional({ type: Number, description: 'Approved budget' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  targetEndDate?: Date;

  @ApiPropertyOptional({ description: 'Project manager user UUID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ example: 'Siaya County, Kenya' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ default: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: MineralType })
  @IsOptional()
  @IsEnum(MineralType)
  mineralType?: MineralType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

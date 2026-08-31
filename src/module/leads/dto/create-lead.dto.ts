import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource, MineralType, Currency } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @ApiProperty({ example: 'Bondo Alluvial Gold Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName: string;

  @ApiProperty({ example: 'James Otieno' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: LeadSource })
  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @ApiPropertyOptional({ enum: MineralType })
  @IsOptional()
  @IsEnum(MineralType)
  mineralType?: MineralType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  miningLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectDescription?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiPropertyOptional({ enum: Currency, default: 'USD' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Assign to a specific user ID' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

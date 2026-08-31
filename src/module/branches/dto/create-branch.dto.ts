import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus, Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBranchDto {
  @ApiPropertyOptional({
    description: 'Branch code. Auto-generated (BR-nnn) when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  code?: string;

  @ApiProperty({ description: 'Business name for this branch' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'System name shown in the shell header' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  systemName?: string;

  @ApiPropertyOptional({ enum: BranchStatus, default: BranchStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // ─── Business profile ──────────────────────────────────────────────────────

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  county?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  // ─── General settings ──────────────────────────────────────────────────────

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ default: 'KSh' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currencySymbol?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ minimum: 0, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  // ─── Session security ──────────────────────────────────────────────────────

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoLogoutEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 480, default: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  idleTimeoutMinutes?: number;

  @ApiPropertyOptional({ minimum: 10, maximum: 300, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(300)
  warningCountdownSeconds?: number;
}

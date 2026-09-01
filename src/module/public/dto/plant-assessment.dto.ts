import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MineralType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class PublicPlantAssessmentDto {
  // ── Contact & Company Profile ──────────────────────────────────────────────
  @ApiProperty({ example: 'Acacia Mining Resources Ltd' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  clientName: string;

  @ApiPropertyOptional({ example: 'Eng. David Ochieng' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  contactPerson?: string;

  @ApiProperty({ example: 'd.ochieng@acaciamining.com' })
  @Transform(trim)
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(160)
  contactEmail: string;

  @ApiPropertyOptional({ example: '+254 711 000 000' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Bondo Gold CIL Expansion Project' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  projectName?: string;

  @ApiPropertyOptional({ example: 'Bondo, Siaya County, Kenya' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  miningLocation?: string;

  // ── Ore & Mineral Characteristics ──────────────────────────────────────────
  @ApiPropertyOptional({ enum: MineralType, default: MineralType.GOLD })
  @IsOptional()
  @IsEnum(MineralType)
  mineralType?: MineralType;

  @ApiPropertyOptional({ example: 25, description: 'Estimated Throughput (t/h)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedTph?: number;

  @ApiPropertyOptional({ example: 4.8, description: 'Head Grade (g/t Au)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  oreGrade?: number;

  @ApiPropertyOptional({ example: 'High-grade quartz vein with minor pyrite sulfides' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  oreMineralogy?: string;

  @ApiPropertyOptional({ example: 'Medium-hard ore, estimated Bond Work Index 14.2 kWh/t' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  oreHardness?: string;

  @ApiPropertyOptional({ example: 'Quartz reef orebody with coarse free gold and localized alluvial gravels' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  oreDescription?: string;

  // ── Existing Plant & Circuit Scope ─────────────────────────────────────────
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasExistingPlant?: boolean;

  @ApiPropertyOptional({ example: '10 tph primary jaw crusher and single-stage ball mill with manual sluice' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  existingPlantDesc?: string;

  @ApiPropertyOptional({ example: 10, description: 'Existing plant capacity (t/h)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  existingCapacity?: number;

  @ApiPropertyOptional({ description: 'Crushing circuit specification' })
  @IsOptional()
  crushingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Grinding circuit specification' })
  @IsOptional()
  grindingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Leaching / CIL circuit specification' })
  @IsOptional()
  leachingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Water and utility specification' })
  @IsOptional()
  waterData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Power specification' })
  @IsOptional()
  powerData?: Record<string, unknown>;

  // ── Performance & Targets ──────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 62, description: 'Current Recovery Percentage (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  currentRecovery?: number;

  @ApiPropertyOptional({ example: 92, description: 'Target Recovery Percentage (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetRecovery?: number;

  @ApiPropertyOptional({ example: 'Excessive gold loss in tailings, high cyanide consumption, poor carbon loading' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  operationalProblems?: string;

  @ApiPropertyOptional({ example: 'Lined tailings containment required with strict cyanide detoxification' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  environmentalConstraints?: string;

  @ApiPropertyOptional({ example: 'Zero-lost-time injury mandate with full PPE and gas monitoring' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  hseConstraints?: string;

  @ApiPropertyOptional({ example: 'Upgrade from gravity-only to turnkey 30 TPH CIL carbon circuit within 6 months' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  clientObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  additionalNotes?: string;

  // ── Anti-bot Honeypot ──────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  company_website?: string;
}

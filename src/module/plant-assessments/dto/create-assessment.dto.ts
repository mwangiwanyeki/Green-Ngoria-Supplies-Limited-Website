import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MineralType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateAssessmentDto {
  // ── Client / project context ──────────────────────────────────────────────
  @ApiProperty({ example: 'Acacia Gold Mining Ltd' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiPropertyOptional({ description: 'UUID of existing client record' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({
    description: 'UUID of lead this assessment came from',
  })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'UUID of mining site' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  // ── Location & mineral ────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Bondo, Siaya County, Kenya' })
  @IsOptional()
  @IsString()
  miningLocation?: string;

  @ApiPropertyOptional({ enum: MineralType })
  @IsOptional()
  @IsEnum(MineralType)
  mineralType?: MineralType;

  // ── Ore characteristics ───────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Ore body description' })
  @IsOptional()
  @IsString()
  oreDescription?: string;

  @ApiPropertyOptional({ description: 'Head grade in g/t (gold) or %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  oreGrade?: number;

  @ApiPropertyOptional({ description: 'Ore mineralogy notes' })
  @IsOptional()
  @IsString()
  oreMineralogy?: string;

  @ApiPropertyOptional({ description: 'Ore hardness / Bond Work Index notes' })
  @IsOptional()
  @IsString()
  oreHardness?: string;

  // ── Existing plant ────────────────────────────────────────────────────────
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasExistingPlant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  existingPlantDesc?: string;

  @ApiPropertyOptional({ description: 'Existing capacity in t/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  existingCapacity?: number;

  // ── Target capacity ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Target throughput in t/h' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedTph?: number;

  // ── Process circuit data (JSON objects) ───────────────────────────────────
  @ApiPropertyOptional({ description: 'Crushing circuit data as JSON' })
  @IsOptional()
  crushingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Grinding circuit data as JSON' })
  @IsOptional()
  grindingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Classification data as JSON' })
  @IsOptional()
  classificationData?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Leaching circuit data (CIP/CIL/Heap) as JSON',
  })
  @IsOptional()
  leachingData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Adsorption (carbon) data as JSON' })
  @IsOptional()
  adsorptionData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Elution / gold recovery data as JSON' })
  @IsOptional()
  elutionData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Tailings management data as JSON' })
  @IsOptional()
  tailingsData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Water supply / balance data as JSON' })
  @IsOptional()
  waterData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Power / electrical data as JSON' })
  @IsOptional()
  powerData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Reagents consumption data as JSON' })
  @IsOptional()
  reagentsData?: Record<string, unknown>;

  // ── Performance ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    description: 'Current recovery %',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  currentRecovery?: number;

  @ApiPropertyOptional({
    description: 'Target recovery %',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetRecovery?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operationalProblems?: string;

  // ── HSE & environment ─────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hseConstraints?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environmentalConstraints?: string;

  // ── Client objectives ─────────────────────────────────────────────────────
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientObjectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

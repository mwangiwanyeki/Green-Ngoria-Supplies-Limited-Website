import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Superset DTO for the four CMS content types. Fields that a given type does not
 * own are ignored, and the per-type required fields are enforced by CmsService.
 */
export class CreateCmsContentDto {
  @ApiProperty({ example: 'Bondo Carbon-In-Leach Optimisation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'bondo-carbon-in-leach-optimisation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case (e.g. my-page-title)',
  })
  slug: string;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({
    description:
      'Rich body stored as JSON. Accepts a structured document or a plain string.',
  })
  @IsOptional()
  content?: unknown;

  @ApiPropertyOptional({ description: 'Pages and articles only' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Services only — short summary' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Services only — icon identifier' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;

  @ApiPropertyOptional({ description: 'Services only — list ordering' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  client?: string;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  mineralType?: string;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  challenge?: string;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiPropertyOptional({ description: 'Case studies only' })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ description: 'Articles only' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;

  @ApiPropertyOptional({ type: [String], description: 'Articles only' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Pages only — storage key of hero image' })
  @IsOptional()
  @IsString()
  featuredImageKey?: string;

  @ApiPropertyOptional({
    description: 'Services, case studies and articles — storage key of image',
  })
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  seoDesc?: string;
}

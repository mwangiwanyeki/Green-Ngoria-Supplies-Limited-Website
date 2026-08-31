import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRecommendationDto {
  @ApiPropertyOptional({
    description: 'UUID of finding this recommendation addresses',
  })
  @IsOptional()
  @IsUUID()
  findingId?: string;

  @ApiProperty({
    description:
      'Engineering recommendation text. NOTE: All recommendations require ' +
      'professional engineering review before being presented as certified advice.',
  })
  @IsString()
  @IsNotEmpty()
  recommendation: string;

  @ApiPropertyOptional({
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedBenefit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requiredWork?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Estimated implementation cost',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ enum: Currency })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;
}

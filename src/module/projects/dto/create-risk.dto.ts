import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRiskDto {
  @ApiProperty({ example: 'Delayed equipment delivery from supplier' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'SCHEDULE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: RiskLevel, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(RiskLevel)
  likelihood?: RiskLevel;

  @ApiPropertyOptional({ enum: RiskLevel, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(RiskLevel)
  impact?: RiskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mitigation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  owner?: string;
}

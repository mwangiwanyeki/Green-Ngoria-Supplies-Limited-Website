import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  scheduledAt: Date;

  @ApiProperty({ enum: ['INITIAL', 'TECHNICAL', 'FOLLOW_UP', 'SITE_VISIT'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextSteps?: string;
}

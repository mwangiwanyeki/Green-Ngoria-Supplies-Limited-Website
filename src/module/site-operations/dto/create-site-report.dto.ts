import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSiteReportDto {
  @ApiProperty({ description: 'Project UUID' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  reportDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weather?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workAreas?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  laborCount?: number;

  @ApiProperty({ description: 'Summary of activities performed' })
  @IsString()
  @IsNotEmpty()
  activities: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  progress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materials?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issues?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nextDayPlan?: string;
}

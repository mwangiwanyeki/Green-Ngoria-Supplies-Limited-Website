import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FindingSeverity } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFindingDto {
  @ApiProperty({
    enum: [
      'CRUSHING',
      'GRINDING',
      'CLASSIFICATION',
      'LEACHING',
      'ADSORPTION',
      'ELUTION',
      'TAILINGS',
      'UTILITIES',
      'SAFETY',
      'ENVIRONMENTAL',
      'MECHANICAL',
      'ELECTRICAL',
      'PROCESS',
      'OTHER',
    ],
    description: 'Process area where the finding was identified',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ enum: FindingSeverity })
  @IsEnum(FindingSeverity)
  severity: FindingSeverity;

  @ApiProperty({ example: 'Inadequate primary crusher reduction ratio' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed field observation' })
  @IsString()
  @IsNotEmpty()
  observation: string;

  @ApiPropertyOptional({ description: 'Supporting evidence or measurements' })
  @IsOptional()
  @IsString()
  evidence?: string;

  @ApiPropertyOptional({ description: 'Specific process area affected' })
  @IsOptional()
  @IsString()
  affectedProcess?: string;

  @ApiPropertyOptional({ description: 'Impact on recovery or throughput' })
  @IsOptional()
  @IsString()
  technicalImpact?: string;
}

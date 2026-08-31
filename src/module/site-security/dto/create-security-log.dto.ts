import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SecurityLogStatus,
  SecurityLogType,
  SecuritySeverity,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSecurityLogDto {
  @ApiProperty({ description: 'Branch the log belongs to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Mining site the event occurred on' })
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  @ApiPropertyOptional({ enum: SecurityLogType, default: SecurityLogType.INCIDENT })
  @IsOptional()
  @IsEnum(SecurityLogType)
  type?: SecurityLogType;

  @ApiPropertyOptional({ enum: SecuritySeverity, default: SecuritySeverity.LOW })
  @IsOptional()
  @IsEnum(SecuritySeverity)
  severity?: SecuritySeverity;

  @ApiPropertyOptional({ enum: SecurityLogStatus, default: SecurityLogStatus.OPEN })
  @IsOptional()
  @IsEnum(SecurityLogStatus)
  status?: SecurityLogStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Guard on duty' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  guardName?: string;

  @ApiPropertyOptional({ description: 'Shift label, e.g. NIGHT or 18:00-06:00' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  shift?: string;

  @ApiPropertyOptional({ description: 'Defaults to now' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
}

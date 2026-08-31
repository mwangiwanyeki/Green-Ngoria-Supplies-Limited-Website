import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SecurityLogStatus,
  SecurityLogType,
  SecuritySeverity,
} from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySecurityLogsDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: SecurityLogStatus })
  @IsOptional()
  @IsEnum(SecurityLogStatus)
  status?: SecurityLogStatus;

  @ApiPropertyOptional({ enum: SecuritySeverity })
  @IsOptional()
  @IsEnum(SecuritySeverity)
  severity?: SecuritySeverity;

  @ApiPropertyOptional({ enum: SecurityLogType })
  @IsOptional()
  @IsEnum(SecurityLogType)
  type?: SecurityLogType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;

  @ApiPropertyOptional({ description: 'Occurred on or after this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Occurred on or before this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

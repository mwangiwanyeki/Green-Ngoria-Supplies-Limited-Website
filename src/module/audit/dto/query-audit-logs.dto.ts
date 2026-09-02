import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryAuditLogsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Audit action, e.g. LOGIN or QUOTATION_APPROVED',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  action?: string;

  @ApiPropertyOptional({
    description: 'Entity name the event was recorded against, e.g. Lead',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entity?: string;

  @ApiPropertyOptional({ description: 'Specific record the event targeted' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  entityId?: string;

  @ApiPropertyOptional({ description: 'Actor who performed the action' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Inclusive lower bound (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound (ISO 8601)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

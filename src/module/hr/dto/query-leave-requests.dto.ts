import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryLeaveRequestsDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: LeaveStatus })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ enum: LeaveType })
  @IsOptional()
  @IsEnum(LeaveType)
  type?: LeaveType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiPropertyOptional({
    description:
      'Only approved leave whose end date has passed with no recorded return (the "Overdue" filter chip)',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Leave starting on or after this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Leave ending on or before this date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

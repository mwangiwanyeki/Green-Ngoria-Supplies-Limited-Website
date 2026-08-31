import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CheckInDto {
  @ApiProperty({ description: 'Branch the staff member is reporting to' })
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsUUID()
  staffId: string;

  @ApiPropertyOptional({ description: 'Work date. Defaults to today.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  workDate?: Date;

  @ApiPropertyOptional({ description: 'Check-in timestamp. Defaults to now.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkInAt?: Date;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    default: AttendanceStatus.CHECKED_IN,
    description: 'Use LATE or HALF_DAY to flag an exception on check-in',
  })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

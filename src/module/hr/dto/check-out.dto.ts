import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CheckOutDto {
  @ApiProperty({ description: 'Branch the staff member reported to' })
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

  @ApiPropertyOptional({ description: 'Check-out timestamp. Defaults to now.' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOutAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

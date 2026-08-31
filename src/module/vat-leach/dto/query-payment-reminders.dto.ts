import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** Drives the "Payment Reminders" tab. */
export class QueryPaymentRemindersDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({
    default: 7,
    minimum: 0,
    maximum: 365,
    description:
      'Include rentals whose next payment falls due within this many days (already-overdue rentals are always included)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  withinDays?: number = 7;
}

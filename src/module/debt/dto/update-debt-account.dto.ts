import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { DebtAccountStatus } from '@prisma/client';

export class UpdateDebtAccountDto {
  @ApiProperty({ description: 'Branch the debt account belongs to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Maximum credit allowed' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    enum: DebtAccountStatus,
    description:
      'Manual override — use for WRITTEN_OFF or SUSPENDED. Balance-derived ' +
      'statuses are recomputed automatically on every payment.',
  })
  @IsOptional()
  @IsEnum(DebtAccountStatus)
  status?: DebtAccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

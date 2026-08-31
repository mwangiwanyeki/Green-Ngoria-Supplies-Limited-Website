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
import { AccountTransactionType } from '@prisma/client';

/** The "Manual Entry" action on the Accounts screen. */
export class CreateManualEntryDto {
  @ApiProperty({ description: 'Branch the account belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({
    enum: AccountTransactionType,
    description: 'CREDIT increases the balance, DEBIT decreases it',
  })
  @IsEnum(AccountTransactionType)
  type: AccountTransactionType;

  @ApiProperty({ example: 15000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'Cash banked from the Bondo till' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ description: 'Slip number, M-Pesa code, etc.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
}

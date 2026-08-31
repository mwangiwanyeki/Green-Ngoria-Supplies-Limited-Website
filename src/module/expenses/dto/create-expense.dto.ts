import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Currency, PaymentMethod } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Branch the expense belongs to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ description: 'Expense category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Financial account the money left' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty({ example: 'Diesel for the plant generator' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 18500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  incurredAt?: Date;
}

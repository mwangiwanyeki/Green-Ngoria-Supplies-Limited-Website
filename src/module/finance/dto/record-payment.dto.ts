import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Currency, PaymentMethod } from '@prisma/client';

export class RecordPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionRef?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @Type(() => Date)
  @IsDate()
  paymentDate: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

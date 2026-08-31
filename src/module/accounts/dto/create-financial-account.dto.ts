import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Currency, FinancialAccountType } from '@prisma/client';

export class CreateFinancialAccountDto {
  @ApiProperty({ description: 'Branch the account belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'M-Pesa Till' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: FinancialAccountType })
  @IsEnum(FinancialAccountType)
  type: FinancialAccountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Safaricom' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  provider?: string;

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description:
      'Balance the account starts at. Also seeds `currentBalance` — after ' +
      'creation the balance only moves through transactions.',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  openingBalance?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

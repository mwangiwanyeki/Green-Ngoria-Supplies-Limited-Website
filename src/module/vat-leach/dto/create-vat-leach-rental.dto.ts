import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVatLeachRentalDto {
  @ApiProperty({ description: 'Branch the rental belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Vat leach unit being rented out' })
  @IsUUID()
  vatLeachUnitId: string;

  @ApiProperty({ description: 'Name of the miner renting the vat' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  renterName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  renterPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  renterEmail?: string;

  @ApiPropertyOptional({ description: 'National ID / passport number' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  renterIdNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  renterLocation?: string;

  @ApiProperty({ description: 'Rental rate for the billing period' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rentalRate: number;

  @ApiPropertyOptional({ description: 'Refundable deposit taken up front' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositHeld?: number;

  @ApiPropertyOptional({
    description: 'Amount billed so far. Defaults to the rental rate.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalBilled?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.KES })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Next payment due date. Defaults to 30 days after start.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextPaymentDue?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

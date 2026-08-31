import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuotationLineItemDto {
  @ApiProperty({ type: Number, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  lineNumber: number;

  @ApiProperty({
    example:
      'CIP Adsorption Tank 50m³ complete with agitator, drive and internals',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'EA' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    type: Number,
    description: 'Unit price in the quotation currency',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Line discount percentage',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateQuotationDto {
  @ApiPropertyOptional({ description: 'Client UUID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'RFQ UUID this quotation responds to' })
  @IsOptional()
  @IsUUID()
  rfqId?: string;

  @ApiProperty({ example: 'CIP Plant Equipment Package — Phase 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Currency, default: 'USD' })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ type: Number, description: 'Tax rate %', default: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ type: Number, description: 'Overall discount amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warrantyTerms?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commercialNotes?: string;

  @ApiPropertyOptional({ description: 'Quotation validity date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validUntil?: Date;

  @ApiProperty({ type: [QuotationLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  lineItems: QuotationLineItemDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Trim incoming string values before validation. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class RfqItemDto {
  @ApiProperty({ example: 'CIP Agitator Drive Gearbox' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(300)
  description: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity: number;

  @ApiProperty({ example: 'EA', default: 'EA' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  unit: string;

  @ApiPropertyOptional({ example: 'Grade 316 stainless' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class RfqDto {
  @ApiProperty({ example: 'Acacia Mining Ltd' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  companyName: string;

  @ApiProperty({ example: 'James Kamau' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  contactName: string;

  @ApiProperty({ example: 'james@example.com' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(160)
  contactEmail: string;

  @ApiPropertyOptional({ example: '+254 700 000 000' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Kenya' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'Bondo, Siaya County' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  deliveryLocation?: string;

  @ApiPropertyOptional({ example: 'Full CIP circuit upgrade…' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: [RfqItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => RfqItemDto)
  items: RfqItemDto[];

  /**
   * Honeypot — must remain empty. Real users never see this field; bots that
   * fill it are silently accepted without persisting or emailing.
   */
  @ApiPropertyOptional({ description: 'Anti-spam honeypot — leave blank' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company_website?: string;
}

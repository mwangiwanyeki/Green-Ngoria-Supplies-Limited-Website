import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Trim incoming string values before validation. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ContactDto {
  @ApiProperty({ example: 'James Otieno' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'Bondo Alluvial Gold Ltd' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  company: string;

  @ApiProperty({ example: 'james@example.com' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(160)
  email: string;

  @ApiPropertyOptional({ example: '+254 700 000 000' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: 'CIP plant enquiry' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'We are planning a gold-processing facility…' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(5000)
  message: string;

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

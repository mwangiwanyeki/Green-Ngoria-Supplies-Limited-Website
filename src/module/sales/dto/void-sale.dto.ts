import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class VoidSaleDto {
  @ApiProperty({ description: 'Branch the sale belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ description: 'Why the sale is being reversed' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({
    description:
      'Mark the sale REFUNDED rather than VOIDED (money was returned to ' +
      'the customer). Stock is reversed either way.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  refund?: boolean;
}

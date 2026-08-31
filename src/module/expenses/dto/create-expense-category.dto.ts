import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @ApiProperty({ description: 'Branch the category belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Fuel & Lubricants' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateInventoryCategoryDto {
  @ApiProperty({ description: 'Branch the category belongs to' })
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: 'Spare Parts' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ description: 'Display file name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @ApiPropertyOptional({ description: 'Accessible description for images' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;
}

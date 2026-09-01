import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file?: unknown;

  @ApiPropertyOptional({
    description: 'Overrides the uploaded file name in the library listing',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @ApiPropertyOptional({ description: 'Accessible description for images' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @ApiPropertyOptional({
    description: 'Intrinsic image width in pixels, measured by the client',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({
    description: 'Intrinsic image height in pixels, measured by the client',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;
}

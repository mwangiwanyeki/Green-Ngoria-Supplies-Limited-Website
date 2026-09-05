import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class TrackPageViewDto {
  @ApiProperty({ description: 'Random per-visit session id from the browser' })
  @IsString()
  @MaxLength(64)
  sessionId: string;

  @ApiProperty({ description: 'Path visited, e.g. /gold-processing' })
  @IsString()
  @MaxLength(512)
  path: string;

  @ApiPropertyOptional({ description: 'document.referrer, if any' })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  referrer?: string;

  @ApiPropertyOptional({ description: 'Time spent on the page, milliseconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;
}

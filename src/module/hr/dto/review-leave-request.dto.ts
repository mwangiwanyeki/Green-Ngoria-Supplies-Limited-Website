import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewLeaveRequestDto {
  @ApiPropertyOptional({ description: 'Reviewer comments' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}

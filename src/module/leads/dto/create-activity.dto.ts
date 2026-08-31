import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'FOLLOW_UP', 'TASK'],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outcome?: string;
}

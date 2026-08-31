import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckOutVisitorDto {
  @ApiPropertyOptional({
    description: 'Override check-out timestamp (defaults to now)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOutAt?: Date;

  @ApiPropertyOptional({ description: 'Notes appended when checking out' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

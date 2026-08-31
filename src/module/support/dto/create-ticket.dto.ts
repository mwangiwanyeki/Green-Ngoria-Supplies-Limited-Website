import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportTicketPriority } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTicketDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() clientId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() subject: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiPropertyOptional({
    enum: ['TECHNICAL', 'SPARE_PARTS', 'WARRANTY', 'GENERAL', 'EMERGENCY'],
  })
  @IsOptional()
  @IsString()
  category?: string;
  @ApiPropertyOptional({ enum: SupportTicketPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SecurityLogStatus } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const CLOSING_STATUSES = [
  SecurityLogStatus.RESOLVED,
  SecurityLogStatus.CLOSED,
] as const;

export class ResolveSecurityLogDto {
  @ApiProperty({ description: 'What was done about the incident' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  resolution: string;

  @ApiPropertyOptional({
    enum: CLOSING_STATUSES,
    default: SecurityLogStatus.RESOLVED,
  })
  @IsOptional()
  @IsEnum(SecurityLogStatus)
  @IsIn(CLOSING_STATUSES as unknown as SecurityLogStatus[])
  status?: SecurityLogStatus;
}

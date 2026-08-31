import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateSecurityLogDto } from './create-security-log.dto';

/** `branchId` is immutable — a log cannot be moved between branches. */
export class UpdateSecurityLogDto extends PartialType(
  OmitType(CreateSecurityLogDto, ['branchId'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;
}

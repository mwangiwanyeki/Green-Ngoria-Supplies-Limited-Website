import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { VatLeachRentalStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CreateVatLeachRentalDto } from './create-vat-leach-rental.dto';

/**
 * `branchId` and `vatLeachUnitId` are immutable — reassigning a rental to
 * another branch would break tenancy scoping, and reassigning the unit would
 * break the availability bookkeeping.
 */
export class UpdateVatLeachRentalDto extends PartialType(
  OmitType(CreateVatLeachRentalDto, ['branchId', 'vatLeachUnitId'] as const),
) {
  @ApiPropertyOptional({ enum: VatLeachRentalStatus })
  @IsOptional()
  @IsEnum(VatLeachRentalStatus)
  status?: VatLeachRentalStatus;

  @ApiPropertyOptional({ description: 'Deposit has been refunded to the renter' })
  @IsOptional()
  @IsBoolean()
  depositRefunded?: boolean;
}

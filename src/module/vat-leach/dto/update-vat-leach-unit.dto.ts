import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVatLeachUnitDto } from './create-vat-leach-unit.dto';

/** `branchId` is immutable — moving a unit between branches is not supported. */
export class UpdateVatLeachUnitDto extends PartialType(
  OmitType(CreateVatLeachUnitDto, ['branchId'] as const),
) {}

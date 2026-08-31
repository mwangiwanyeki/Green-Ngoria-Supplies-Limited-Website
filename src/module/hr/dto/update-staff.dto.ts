import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';

/** `branchId` is immutable — transferring staff between branches is a
 * deliberate operation, not a field edit. */
export class UpdateStaffDto extends PartialType(
  OmitType(CreateStaffDto, ['branchId'] as const),
) {}

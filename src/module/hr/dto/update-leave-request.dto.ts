import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateLeaveRequestDto } from './create-leave-request.dto';

/** `branchId` and `staffId` are immutable — reassigning either would break
 * tenancy scoping and the staff's leave ledger. */
export class UpdateLeaveRequestDto extends PartialType(
  OmitType(CreateLeaveRequestDto, ['branchId', 'staffId'] as const),
) {}

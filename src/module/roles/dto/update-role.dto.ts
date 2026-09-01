import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/**
 * A role's machine `name` is immutable once created — permissions, guards and
 * historic audit records all reference it. Only presentation fields and the
 * granted permission set may change.
 */
export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['name'] as const),
) {}

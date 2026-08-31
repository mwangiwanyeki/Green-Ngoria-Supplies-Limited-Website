import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

/**
 * `branchId` stays REQUIRED on update — the branch an item lives in is part of
 * its identity and is re-verified against the caller's organization, so it must
 * never be optional or silently inferred.
 */
export class UpdateInventoryItemDto extends PartialType(
  OmitType(CreateInventoryItemDto, ['branchId', 'quantity'] as const),
) {
  @ApiProperty({ description: 'Branch the item belongs to' })
  @IsUUID()
  branchId: string;
}

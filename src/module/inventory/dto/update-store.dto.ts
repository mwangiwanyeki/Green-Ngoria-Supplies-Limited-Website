import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateStoreDto } from './create-store.dto';

export class UpdateStoreDto extends PartialType(
  OmitType(CreateStoreDto, ['branchId'] as const),
) {
  @ApiProperty({ description: 'Branch the store belongs to' })
  @IsUUID()
  branchId: string;
}

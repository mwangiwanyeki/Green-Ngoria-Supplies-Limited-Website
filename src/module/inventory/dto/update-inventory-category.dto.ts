import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateInventoryCategoryDto } from './create-inventory-category.dto';

export class UpdateInventoryCategoryDto extends PartialType(
  OmitType(CreateInventoryCategoryDto, ['branchId'] as const),
) {
  @ApiProperty({ description: 'Branch the category belongs to' })
  @IsUUID()
  branchId: string;
}

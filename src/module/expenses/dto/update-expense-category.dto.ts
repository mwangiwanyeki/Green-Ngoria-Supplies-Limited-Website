import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateExpenseCategoryDto } from './create-expense-category.dto';

export class UpdateExpenseCategoryDto extends PartialType(
  OmitType(CreateExpenseCategoryDto, ['branchId'] as const),
) {
  @ApiProperty({ description: 'Branch the category belongs to' })
  @IsUUID()
  branchId: string;
}

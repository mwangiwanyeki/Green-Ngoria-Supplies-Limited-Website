import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';

export class UpdateExpenseDto extends PartialType(
  OmitType(CreateExpenseDto, ['branchId'] as const),
) {
  @ApiProperty({ description: 'Branch the expense belongs to' })
  @IsUUID()
  branchId: string;
}

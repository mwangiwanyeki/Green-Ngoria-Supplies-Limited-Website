import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(
  OmitType(CreateCustomerDto, ['branchId'] as const),
) {
  @ApiProperty({ description: 'Branch the customer belongs to' })
  @IsUUID()
  branchId: string;
}

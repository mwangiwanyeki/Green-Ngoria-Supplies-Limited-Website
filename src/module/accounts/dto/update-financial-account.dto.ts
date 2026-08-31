import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateFinancialAccountDto } from './create-financial-account.dto';

/**
 * `openingBalance` is omitted deliberately: once an account exists its balance
 * may only move through `AccountTransaction` rows, so the ledger always
 * reconciles to `currentBalance`.
 */
export class UpdateFinancialAccountDto extends PartialType(
  OmitType(CreateFinancialAccountDto, ['branchId', 'openingBalance'] as const),
) {
  @ApiProperty({ description: 'Branch the account belongs to' })
  @IsUUID()
  branchId: string;
}

import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStockPileDto } from './create-stock-pile.dto';

/**
 * `branchId` is immutable, and `tonnage` can only move through
 * `POST /stock-piles/:id/movements` so that every change is journalled.
 */
export class UpdateStockPileDto extends PartialType(
  OmitType(CreateStockPileDto, ['branchId', 'tonnage'] as const),
) {}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VatLeachRentalStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryVatLeachRentalsDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: VatLeachRentalStatus })
  @IsOptional()
  @IsEnum(VatLeachRentalStatus)
  status?: VatLeachRentalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vatLeachUnitId?: string;
}

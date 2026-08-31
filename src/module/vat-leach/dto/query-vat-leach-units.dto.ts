import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VatLeachStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryVatLeachUnitsDto extends PaginationDto {
  @ApiProperty({ description: 'Branch to scope the query to' })
  @IsUUID()
  branchId: string;

  @ApiPropertyOptional({ enum: VatLeachStatus })
  @IsOptional()
  @IsEnum(VatLeachStatus)
  status?: VatLeachStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  miningSiteId?: string;
}

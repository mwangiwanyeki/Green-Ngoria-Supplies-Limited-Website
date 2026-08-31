import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SaleChannel, SaleStatus } from '@prisma/client';
import { BranchScopedPaginationDto } from '../../../common/dto/branch-scope.dto';

export class QuerySalesDto extends BranchScopedPaginationDto {
  @ApiPropertyOptional({ enum: SaleStatus })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @ApiPropertyOptional({ enum: SaleChannel })
  @IsOptional()
  @IsEnum(SaleChannel)
  channel?: SaleChannel;

  @ApiPropertyOptional({ description: 'Only sales for this customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Inclusive lower bound on soldAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on soldAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

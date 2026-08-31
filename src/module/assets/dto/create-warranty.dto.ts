import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateWarrantyDto {
  @IsString()
  provider: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsString()
  @IsOptional()
  coverage?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  contractRef?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

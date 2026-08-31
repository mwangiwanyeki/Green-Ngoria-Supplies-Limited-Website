import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MineralType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMiningSiteDto {
  @ApiProperty({ example: 'Bondo Gold Fields' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: 'Kenya' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Siaya County' })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiPropertyOptional({ example: '-0.3456,34.1234' })
  @IsOptional()
  @IsString()
  coordinates?: string;

  @ApiPropertyOptional({ enum: MineralType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MineralType, { each: true })
  mineralTypes?: MineralType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

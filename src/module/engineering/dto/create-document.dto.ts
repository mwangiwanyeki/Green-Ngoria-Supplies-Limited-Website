import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateDocumentDto {
  @ApiPropertyOptional({ description: 'Project UUID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ example: 'GNG-CIP-PFD-001' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ example: 'CIP Plant Process Flow Diagram' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional({ default: 'REV_00' })
  @IsOptional()
  @IsString()
  revision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ isArray: true, description: 'Tags for searchability' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Reviewer user UUID' })
  @IsOptional()
  @IsUUID()
  reviewerId?: string;

  @ApiPropertyOptional({ description: 'Approver user UUID' })
  @IsOptional()
  @IsUUID()
  approverId?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'PLANT_AUDITOR',
    description:
      'Unique machine name for the role. UPPER_SNAKE_CASE, letters, digits and underscores only.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'name must be UPPER_SNAKE_CASE (e.g. PLANT_AUDITOR)',
  })
  name: string;

  @ApiProperty({ example: 'Plant Auditor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  displayName: string;

  @ApiPropertyOptional({
    example:
      'Read-only access to plant assessments and commissioning evidence.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Permission IDs granted to this role',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  permissionIds?: string[];
}

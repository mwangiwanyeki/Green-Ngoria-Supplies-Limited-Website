import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ enum: SystemRole, default: SystemRole.CLIENT_USER })
  @IsOptional()
  @IsEnum(SystemRole)
  role?: SystemRole;
}

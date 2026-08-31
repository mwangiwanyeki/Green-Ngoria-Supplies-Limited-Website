import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ enum: SystemRole })
  @IsEnum(SystemRole)
  @IsNotEmpty()
  role: SystemRole;
}

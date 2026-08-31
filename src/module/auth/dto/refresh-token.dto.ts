import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Optional for browsers using the signed HttpOnly cookie',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

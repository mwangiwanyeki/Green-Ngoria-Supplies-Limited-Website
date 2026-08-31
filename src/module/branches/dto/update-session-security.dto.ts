import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

/** Settings → Session Security tab (idle auto-logout policy). */
export class UpdateSessionSecurityDto {
  @ApiPropertyOptional({
    description: 'Ends the session when there is no user activity',
  })
  @IsOptional()
  @IsBoolean()
  autoLogoutEnabled?: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 480,
    description: 'Between 1 and 480 minutes',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  idleTimeoutMinutes?: number;

  @ApiPropertyOptional({
    minimum: 10,
    maximum: 300,
    description: 'Between 10 and 300 seconds',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(300)
  warningCountdownSeconds?: number;
}

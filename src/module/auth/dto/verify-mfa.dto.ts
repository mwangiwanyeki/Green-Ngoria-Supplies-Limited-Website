import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({ description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'MFA code must be exactly 6 digits' })
  code: string;
}

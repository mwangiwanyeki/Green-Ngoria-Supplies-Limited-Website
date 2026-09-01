import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ConfigService } from '../../config/config.module';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthUser } from './auth.types';
import {
  successResponse,
  messageResponse,
} from '../../common/response/api-response';

// Stricter rate limit for auth-sensitive endpoints (login, register,
// forgot-password) — read at module-load time, matching the pattern used
// by ThrottlerModule.forRoot() in app.module.ts.
const AUTH_THROTTLE = {
  default: {
    ttl: parseInt(process.env.AUTH_THROTTLE_TTL_SECONDS ?? '60', 10) * 1000,
    limit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
  },
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(
      dto,
      req.ip ?? req.socket?.remoteAddress,
    );
    return successResponse(result, 'Registration successful');
  }

  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address via token' })
  async verifyEmail(@Query('token') token: string) {
    const result = await this.authService.verifyEmail(token);
    return successResponse(result);
  }

  @Post('login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive tokens' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.ip ?? req.socket?.remoteAddress,
      req.headers['user-agent'],
    );
    const { refreshToken, ...publicResult } = result;
    if (refreshToken) this.setRefreshCookie(response, refreshToken);
    return successResponse(publicResult);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const signedCookies = req.signedCookies as
      Record<string, string> | undefined;
    const refreshToken = signedCookies?.gng_refresh ?? dto.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const result = await this.authService.refreshTokens(refreshToken);
    this.setRefreshCookie(response, result.refreshToken);
    return successResponse({ accessToken: result.accessToken });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out current session' })
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(
      user.sessionId,
      user.id,
      req.ip ?? req.socket?.remoteAddress,
    );
    this.clearRefreshCookie(response);
    return messageResponse('Logged out successfully');
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all sessions for the current user' })
  async logoutAll(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(user.id);
    this.clearRefreshCookie(response);
    return messageResponse('All sessions revoked');
  }

  @Post('forgot-password')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const result = await this.authService.forgotPassword(
      dto.email,
      req.ip ?? req.socket?.remoteAddress,
    );
    return successResponse(result);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const result = await this.authService.resetPassword(
      dto.token,
      dto.password,
      req.ip ?? req.socket?.remoteAddress,
    );
    return successResponse(result);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password while authenticated' })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const result = await this.authService.changePassword(
      user.id,
      dto,
      user.sessionId,
      req.ip ?? req.socket?.remoteAddress,
    );
    return successResponse(result);
  }

  // ─── MFA ───────────────────────────────────────────────────────────────────

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate MFA setup — returns TOTP secret and QR URL',
  })
  async setupMfa(@CurrentUser() user: AuthUser) {
    const result = await this.authService.setupMfa(user.id);
    return successResponse(result);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm MFA setup with a valid TOTP code' })
  async enableMfa(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaDto) {
    const result = await this.authService.enableMfa(user.id, dto.code);
    return successResponse(result);
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard)
  @Throttle(AUTH_THROTTLE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA (requires current TOTP code)' })
  async disableMfa(@CurrentUser() user: AuthUser, @Body() dto: VerifyMfaDto) {
    const result = await this.authService.disableMfa(user.id, dto.code);
    return successResponse(result);
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for the current user' })
  async getSessions(@CurrentUser() user: AuthUser) {
    const sessions = await this.authService.getSessions(user.id);
    return successResponse(sessions);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('id') sessionId: string,
  ) {
    const result = await this.authService.revokeSession(sessionId, user.id);
    return successResponse(result);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  me(@CurrentUser() user: AuthUser) {
    return successResponse(user);
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie('gng_refresh', refreshToken, this.refreshCookieOptions());
  }

  private clearRefreshCookie(response: Response): void {
    const { maxAge: _maxAge, ...options } = this.refreshCookieOptions();
    response.clearCookie('gng_refresh', options);
  }

  /**
   * Cookie options shared by set/clear so they always match (a mismatch
   * silently prevents clearCookie from working).
   *
   * `domain` is set from COOKIE_DOMAIN (e.g. `.greenngoria.com`) in
   * production so the single cookie is shared across every subdomain — the
   * frontend edge middleware on greenngoria.com/portal./admin. must be able
   * to read it, and the API on api. must receive it. `path: '/'` (not
   * `/api/v1/auth`) is required for that same cross-surface visibility.
   * `sameSite: 'lax'` is safe here because all surfaces share the
   * `greenngoria.com` registrable domain (same-site requests). In local
   * dev COOKIE_DOMAIN is unset, so the cookie is host-only as before.
   */
  private refreshCookieOptions() {
    const isProd = this.config.get<string>('nodeEnv') === 'production';
    const cookieDomain = this.config.get<string>('auth.cookieDomain');
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      signed: true,
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }
}

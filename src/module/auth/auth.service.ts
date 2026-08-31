import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { SystemRole } from '@prisma/client';
import { PrismaService } from '../../lib/database/prisma.service';
import { MailService } from '../../lib/mail/mail.service';
import { AuditService } from '../../lib/audit/audit.service';
import { AuditAction } from '../../lib/audit/audit.types';
import { encrypt, decrypt } from '../../common/utils/encryption.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Registration ──────────────────────────────────────────────────────────

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const emailVerificationToken = this.createEmailVerificationToken();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        emailVerificationToken,
        status: 'PENDING_VERIFICATION',
      },
    });

    // Send verification email (fire-and-forget — never block registration)
    const verificationUrl = `${this.config.get('urls.frontend')}/auth/verify-email?token=${emailVerificationToken}`;
    this.mailService
      .sendEmailVerification(user.email, {
        name: user.firstName,
        verificationUrl,
        expiresIn: '48 hours',
      })
      .catch((err) => this.logger.error('Email verification send failed', err));

    await this.auditService.logAuth(
      AuditAction.USER_CREATED,
      user.id,
      ipAddress,
    );

    this.logger.log(`New user registered: ${user.email}`);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  // ─── Email verification ────────────────────────────────────────────────────

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified', status: 'already-verified' };
    }

    // Enforce the expiry embedded (and authenticated) inside the token itself.
    // We deliberately avoid a dedicated DB column: the token carries its own
    // AES-GCM-sealed expiry, so it cannot be tampered with or replayed past
    // its lifetime.
    const expiresAt = this.readEmailTokenExpiry(token);
    if (expiresAt === null || expiresAt < Date.now()) {
      // Burn the dead token so it cannot be probed or reused.
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerificationToken: null },
      });
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        status: 'ACTIVE',
      },
    });

    await this.auditService.logAuth(AuditAction.EMAIL_VERIFIED, user.id);

    return {
      message: 'Email verified successfully. You can now log in.',
      status: 'verified',
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        organizationMemberships: {
          where: { removedAt: null },
          orderBy: { joinedAt: 'asc' },
          take: 1,
        },
      },
    });

    // Always run password hash even if user not found — prevent timing attacks
    const dummyHash =
      '$argon2id$v=19$m=65536,t=3,p=4$dummydummydummy$dummydummydummydummydummydummydummydummy';

    const passwordToVerify = user?.passwordHash ?? dummyHash;

    let passwordValid = false;
    try {
      passwordValid = await argon2.verify(passwordToVerify, dto.password);
    } catch {
      passwordValid = false;
    }

    if (!user || !passwordValid) {
      if (user) {
        await this.handleFailedLogin(user.id, ipAddress);
      }
      await this.auditService.logAuth(
        AuditAction.LOGIN_FAILED,
        user?.id ?? 'unknown',
        ipAddress,
        userAgent,
        { email: dto.email },
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}. Please contact support.`,
      );
    }

    // Check account status
    if (user.status === 'PENDING_VERIFICATION') {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }

    if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact support.',
      );
    }

    // MFA check
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return { requiresMfa: true, message: 'MFA code required' };
      }
      const mfaValid = await this.verifyTotp(user.id, dto.mfaCode);
      if (!mfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Extract roles and permissions
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ] as string[];

    const primaryOrgId = user.organizationMemberships[0]?.organizationId;

    // Create session
    const sessionId = uuidv4();
    const refreshToken = this.createRefreshToken();
    const refreshExpiresIn =
      this.config.get<string>('auth.jwtRefreshExpiresIn') ?? '7d';
    const refreshExpiresAt = this.parseExpiry(refreshExpiresIn);

    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken: this.hashRefreshToken(refreshToken),
        ipAddress,
        userAgent,
        expiresAt: refreshExpiresAt,
      },
    });

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      roles,
      permissions,
      sessionId,
      primaryOrgId,
    );

    await this.auditService.logAuth(
      AuditAction.LOGIN,
      user.id,
      ipAddress,
      userAgent,
    );

    this.logger.log(`User logged in: ${user.email}`);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('auth.jwtExpiresIn') ?? '15m',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        permissions,
        organizationId: primaryOrgId,
      },
    };
  }

  // ─── Token refresh ─────────────────────────────────────────────────────────

  async refreshTokens(oldRefreshToken: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshToken: this.hashRefreshToken(oldRefreshToken) },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: { include: { permission: true } },
                  },
                },
              },
            },
            organizationMemberships: {
              where: { removedAt: null },
              orderBy: { joinedAt: 'asc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;
    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code),
        ),
      ),
    ] as string[];
    const primaryOrgId = user.organizationMemberships[0]?.organizationId;

    // Rotate refresh token (token rotation strategy)
    const newRefreshToken = this.createRefreshToken();
    const refreshExpiresAt = this.parseExpiry(
      this.config.get<string>('auth.jwtRefreshExpiresIn') ?? '7d',
    );

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: this.hashRefreshToken(newRefreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      roles,
      permissions,
      session.id,
      primaryOrgId,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(sessionId: string, userId: string, ipAddress?: string) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.logAuth(AuditAction.LOGOUT, userId, ipAddress);
  }

  async logoutAll(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.logAuth(AuditAction.SESSION_REVOKED, userId);
  }

  // ─── Password reset ────────────────────────────────────────────────────────

  async forgotPassword(email: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    // Always return success — never reveal whether email exists
    if (!user) {
      return {
        message:
          'If that email is registered, you will receive a reset link shortly.',
      };
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    });

    const resetUrl = `${this.config.get('urls.frontend')}/auth/reset-password?token=${token}`;

    this.mailService
      .sendPasswordReset(user.email, {
        name: user.firstName,
        resetUrl,
        expiresIn: '1 hour',
      })
      .catch((err) => this.logger.error('Password reset email failed', err));

    await this.auditService.logAuth(
      AuditAction.PASSWORD_RESET_REQUESTED,
      user.id,
      ipAddress,
    );

    return {
      message:
        'If that email is registered, you will receive a reset link shortly.',
    };
  }

  async resetPassword(token: string, newPassword: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (
      !user ||
      !user.passwordResetExpiry ||
      user.passwordResetExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Revoke all sessions for security
      await tx.userSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.auditService.logAuth(
      AuditAction.PASSWORD_CHANGED,
      user.id,
      ipAddress,
    );

    this.mailService
      .sendPasswordChanged(user.email, {
        name: user.firstName,
        timestamp: new Date().toLocaleString('en-KE', {
          timeZone: 'Africa/Nairobi',
        }),
        ipAddress: ipAddress ?? 'Unknown',
      })
      .catch((err) => this.logger.error('Password changed email failed', err));

    return { message: 'Password reset successfully. Please log in.' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    currentSessionId?: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Revoke every OTHER active session. A password change must invalidate
      // sessions on other devices, but keep the caller's current session alive
      // (they just re-authenticated with their current password).
      await tx.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
        },
        data: { revokedAt: new Date() },
      });
    });

    await this.auditService.logAuth(
      AuditAction.PASSWORD_CHANGED,
      userId,
      ipAddress,
    );

    this.mailService
      .sendPasswordChanged(user.email, {
        name: user.firstName,
        timestamp: new Date().toLocaleString('en-KE', {
          timeZone: 'Africa/Nairobi',
        }),
        ipAddress: ipAddress ?? 'Unknown',
      })
      .catch((err) => this.logger.error('Password changed email failed', err));

    return { message: 'Password changed successfully' };
  }

  // ─── MFA ───────────────────────────────────────────────────────────────────

  async setupMfa(
    userId: string,
  ): Promise<{ secret: string; otpauthUrl: string }> {
    const secret = this.generateTotpSecret();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const issuer = this.config.get<string>('auth.mfaIssuer') ?? 'GreenNgoria';
    const otpauthUrl = authenticator.keyuri(
      user?.email ?? userId,
      issuer,
      secret,
    );

    // Store the secret encrypted at rest — not enabled until verified via
    // enableMfa(). The plaintext secret is only ever returned to the caller
    // here, for populating the authenticator app / QR code.
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encrypt(secret, this.getEncryptionKey()) },
    });

    return { secret, otpauthUrl };
  }

  async enableMfa(userId: string, code: string): Promise<{ message: string }> {
    const valid = await this.verifyTotp(userId, code);
    if (!valid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await this.auditService.logAuth(AuditAction.MFA_ENABLED, userId);

    return { message: 'MFA enabled successfully' };
  }

  async disableMfa(userId: string, code: string): Promise<{ message: string }> {
    const valid = await this.verifyTotp(userId, code);
    if (!valid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    await this.auditService.logAuth(AuditAction.MFA_DISABLED, userId);

    return { message: 'MFA disabled successfully' };
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async revokeSession(sessionId: string, userId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    await this.auditService.logAuth(AuditAction.SESSION_REVOKED, userId);

    return { message: 'Session revoked' };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async generateAccessToken(
    userId: string,
    email: string,
    roles: SystemRole[],
    permissions: string[],
    sessionId: string,
    orgId?: string,
  ) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      orgId,
      roles,
      permissions,
      sessionId,
    };

    return this.jwtService.signAsync(accessPayload, {
      secret: this.config.get<string>('auth.jwtSecret'),
      expiresIn: this.config.get('auth.jwtExpiresIn') ?? '15m',
    });
  }

  private createRefreshToken(): string {
    return crypto.randomBytes(48).toString('base64url');
  }

  // ─── Email-verification token (self-describing, expiry-sealed) ──────────────
  // The token is an AES-GCM-encrypted, URL-safe payload carrying a random
  // nonce plus an absolute expiry timestamp. Because the payload is
  // authenticated with ENCRYPTION_KEY, the expiry cannot be forged, and no
  // extra schema column is required to enforce it. The full token string is
  // stored on the user row so lookup + single-use invalidation still work.
  private static readonly EMAIL_VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000;

  private createEmailVerificationToken(): string {
    const payload = JSON.stringify({
      n: crypto.randomBytes(16).toString('hex'),
      exp: Date.now() + AuthService.EMAIL_VERIFICATION_TTL_MS,
    });
    return this.toBase64Url(encrypt(payload, this.getEncryptionKey()));
  }

  private readEmailTokenExpiry(token: string): number | null {
    try {
      const json = decrypt(this.fromBase64Url(token), this.getEncryptionKey());
      const parsed = JSON.parse(json) as { exp?: unknown };
      return typeof parsed.exp === 'number' ? parsed.exp : null;
    } catch {
      return null;
    }
  }

  private toBase64Url(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private fromBase64Url(value: string): string {
    const padLength = value.length % 4 === 0 ? 0 : 4 - (value.length % 4);
    return (
      value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength)
    );
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async handleFailedLogin(userId: string, ipAddress?: string) {
    const maxAttempts = this.config.get<number>('auth.maxFailedAttempts') ?? 5;
    const lockoutMinutes =
      this.config.get<number>('auth.lockoutDurationMinutes') ?? 30;

    // Atomic increment — avoids a read-then-write race where two concurrent
    // failed logins could both read the same stale attempt count.
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });

    const attempts = updated.failedLoginAttempts;
    const shouldLock = attempts >= maxAttempts;

    if (shouldLock) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: new Date(Date.now() + lockoutMinutes * 60 * 1000),
          status: 'LOCKED',
        },
      });
    }

    if (shouldLock) {
      await this.auditService.logAuth(
        AuditAction.ACCOUNT_LOCKED,
        userId,
        ipAddress,
        undefined,
        { attempts },
      );
      this.logger.warn(
        `Account locked after ${attempts} failed attempts: ${userId}`,
      );
    }
  }

  private async verifyTotp(userId: string, code: string): Promise<boolean> {
    if (!/^\d{6}$/.test(code)) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) return false;

    let secret: string;
    try {
      secret = decrypt(user.mfaSecret, this.getEncryptionKey());
    } catch (error) {
      this.logger.error('Failed to decrypt MFA secret', error);
      return false;
    }

    authenticator.options = { window: 1 };
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      return false;
    }
  }

  private generateTotpSecret(): string {
    return authenticator.generateSecret();
  }

  private getEncryptionKey(): string {
    const key = this.config.get<string>('encryption.key');
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY is not configured — required to encrypt/decrypt MFA secrets',
      );
    }
    return key;
  }

  private parseExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multipliers[unit] ?? 1000));
  }
}

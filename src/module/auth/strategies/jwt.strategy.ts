import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '../../../config/config.module';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../lib/database/prisma.service';
import { JwtPayload, AuthUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwtSecret') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Single round trip: fetch the user and nest the session lookup under
    // it, instead of two sequential findUnique calls.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        sessions: {
          where: { id: payload.sessionId },
          select: { revokedAt: true, expiresAt: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const session = user.sessions[0];

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: payload.orgId,
      roles: payload.roles,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };
  }
}

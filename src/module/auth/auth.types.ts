import { SystemRole } from '@prisma/client';

/**
 * The shape of the JWT access token payload.
 * Kept minimal — no sensitive data ever goes in a JWT.
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  orgId?: string; // primary organization context
  roles: SystemRole[];
  permissions: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * The shape of the refresh token payload.
 */
export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
}

/**
 * Authenticated user object attached to request.user by the JWT strategy.
 * Available via @CurrentUser() in controllers.
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  roles: SystemRole[];
  permissions: string[];
  sessionId: string;
}

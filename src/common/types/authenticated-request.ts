import type { Request } from 'express';
import type { AuthUser } from '../../module/auth/auth.types';

/** Express request after Passport authentication and request tracing. */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  requestId?: string;
}

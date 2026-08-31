import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as publicly accessible — bypasses JWT auth guard.
 * Use sparingly: only on routes that genuinely require no authentication.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

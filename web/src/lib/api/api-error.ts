export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: unknown[],
    public readonly path?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.statusCode === 401;
  }
  get isForbidden() {
    return this.statusCode === 403;
  }
  get isNotFound() {
    return this.statusCode === 404;
  }
  get isValidation() {
    return this.statusCode === 422 || this.statusCode === 400;
  }
  get isRateLimit() {
    return this.statusCode === 429;
  }
  get isServer() {
    return this.statusCode >= 500;
  }

  /** Human-readable message safe to show users */
  get displayMessage(): string {
    if (this.isUnauthorized) {
      // Prefer a specific server message — login rejections such as
      // "Invalid MFA code" or "Invalid email or password" are 401s but are
      // NOT session-expiry. Only fall back to the generic session-expired
      // copy when the server sent nothing useful (a bare "Unauthorized",
      // which is what an actually-expired token guard returns).
      if (this.message && !/^unauthorized\.?$/i.test(this.message.trim())) {
        return this.message;
      }
      return 'Your session has expired. Please log in again.';
    }
    if (this.isForbidden)
      return 'You do not have permission to perform this action.';
    if (this.isNotFound) return 'The requested resource was not found.';
    if (this.isRateLimit) return 'Too many requests. Please slow down.';
    if (this.isServer) return 'A server error occurred. Please try again.';
    return this.message;
  }
}

/**
 * Normalises anything thrown by a mutation into a message that is safe and
 * useful to show in a toast. Prefers the first server-side validation error
 * (class-validator returns them in `errors`) over the generic status message.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof ApiError) {
    if (error.isValidation && error.errors?.length) {
      const first = error.errors[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && 'message' in first) {
        const message = (first as { message?: unknown }).message;
        if (typeof message === 'string') return message;
        if (Array.isArray(message) && typeof message[0] === 'string') {
          return message[0];
        }
      }
    }
    return error.displayMessage || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

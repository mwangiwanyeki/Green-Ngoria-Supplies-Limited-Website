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
    if (this.isUnauthorized)
      return 'Your session has expired. Please log in again.';
    if (this.isForbidden)
      return 'You do not have permission to perform this action.';
    if (this.isNotFound) return 'The requested resource was not found.';
    if (this.isRateLimit) return 'Too many requests. Please slow down.';
    if (this.isServer) return 'A server error occurred. Please try again.';
    return this.message;
  }
}

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Permissions_KEY = 'permissions';

/**
 * Restrict a route to specific roles.
 * Example: @Roles('ADMIN', 'PROJECT_MANAGER')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Restrict a route to specific permissions.
 * Example: @Permissions('quotation:approve')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(Permissions_KEY, permissions);

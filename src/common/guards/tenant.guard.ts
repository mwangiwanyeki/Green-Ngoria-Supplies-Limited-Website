import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OrganizationsService } from '../../module/organizations/organizations.service';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Enforces membership for every route that declares an `:orgId` parameter.
 * This prevents IDOR attacks when a valid user guesses another tenant UUID.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly organizations: OrganizationsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const organizationId = request.params.orgId;

    if (!organizationId) return true;
    if (Array.isArray(organizationId)) {
      throw new UnauthorizedException('Invalid organization context');
    }
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    await this.organizations.assertMembership(organizationId, request.user.id);
    return true;
  }
}

/**
 * Branch scoping helpers for the Operations ERP.
 *
 * Every ERP record carries both an `organizationId` and a `branchId`. The
 * `TenantGuard` already proves the caller is a member of the organization in
 * the `:orgId` route parameter, but the `branchId` arrives as untrusted input
 * (query string or body). Passing it straight into a `where` clause would be a
 * cross-tenant IDOR: a member of org A could read org B's branch data.
 *
 * Every ERP service therefore calls `assertBranchInOrganization()` before the
 * branch id is used, and then filters by BOTH ids on every query.
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';

/** Root PrismaService or a `$transaction` callback's `tx` client. */
export type BranchScopeDbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Verifies that `branchId` names a live branch belonging to `organizationId`.
 * Throws rather than returning a boolean so callers cannot forget to check.
 */
export async function assertBranchInOrganization(
  db: BranchScopeDbClient,
  organizationId: string,
  branchId: string,
): Promise<void> {
  const branch = await db.branch.findFirst({
    where: { id: branchId, deletedAt: null },
    select: { id: true, organizationId: true },
  });

  if (!branch) {
    throw new NotFoundException('Branch not found');
  }
  if (branch.organizationId !== organizationId) {
    throw new ForbiddenException('Branch does not belong to this organization');
  }
}

/**
 * The `where` fragment that scopes a query to one organization AND one branch,
 * excluding soft-deleted rows. Use on every list/read/mutate query.
 */
export function branchScope(organizationId: string, branchId: string) {
  return { organizationId, branchId, deletedAt: null };
}

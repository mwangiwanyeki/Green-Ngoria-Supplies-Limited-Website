'use client';

import { useEffect } from 'react';
import { useBranches } from '@/lib/api/hooks/use-branches';
import { useBranchStore } from '@/stores/branch-store';

/**
 * Fetches the organization's branches once per admin session and syncs them
 * into the branch store, so `activeBranchId` is populated for every ERP
 * hook (`useErpList`/`useErpResource`) that requires it on every request.
 * Renders nothing — mount once near the root of the admin layout.
 */
export function BranchBootstrap() {
  const { data: branches } = useBranches();
  const setBranches = useBranchStore((s) => s.setBranches);

  useEffect(() => {
    if (branches) setBranches(branches);
  }, [branches, setBranches]);

  return null;
}

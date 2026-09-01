'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patch, post, del } from '../api-client';
import { useAuthStore } from '@/stores/auth-store';
import { useBranchStore } from '@/stores/branch-store';
import { useErpList, useErpResource } from './use-erp';

// ─── Enums (mirror Prisma) ────────────────────────────────────────────────────

export const STOCK_MOVEMENT_TYPES = [
  'PURCHASE',
  'ADJUSTMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'RETURN',
  'WRITE_OFF',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  PURCHASE: 'Purchase / Receive',
  ADJUSTMENT: 'Adjustment',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  RETURN: 'Return',
  WRITE_OFF: 'Write-off',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  unitOfMeasure?: string;
  unitPrice?: number | string;
  costPrice?: number | string;
  quantity?: number;
  reorderLevel?: number;
  barcode?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  // Backend returns nested relations as objects
  category?: { id: string; name: string } | null;
  store?: { id: string; name: string } | null;
}

/** Backend getStats() returns these exact field names */
export interface InventoryStats {
  stockOnHandValue: string | number;
  inStockCount: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalItems: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string | null;
  _count?: { items: number };
}

export interface InventoryStore {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  isDefault?: boolean;
  _count?: { items: number };
}

// ─── Mutation payloads ────────────────────────────────────────────────────────

export interface CreateInventoryItemPayload {
  branchId: string;
  name: string;
  unitPrice: number;
  costPrice?: number;
  quantity?: number;
  reorderLevel?: number;
  categoryId?: string;
  storeId?: string;
  unitOfMeasure?: string;
  description?: string;
  barcode?: string;
  isActive?: boolean;
}

export interface UpdateInventoryItemPayload extends Partial<CreateInventoryItemPayload> {
  branchId: string;
}

export interface AdjustStockPayload {
  branchId: string;
  quantityDelta: number;
  type: StockMovementType;
  reason?: string;
  unitCost?: number;
}

export interface CreateStorePayload {
  branchId: string;
  name: string;
  location?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateStorePayload extends Partial<
  Omit<CreateStorePayload, 'branchId'>
> {
  branchId: string;
}

// ─── Context helper ───────────────────────────────────────────────────────────

function useErpContext() {
  const orgId = useAuthStore((s) => s.user?.organizationId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const branchId = useBranchStore((s) => s.activeBranchId);
  return { orgId, accessToken, branchId };
}

function erpKey(
  orgId: string | undefined,
  branchId: string | null | undefined,
) {
  return ['erp', orgId, branchId] as const;
}

// ─── List / resource queries ──────────────────────────────────────────────────

export function useInventoryItems(params?: {
  search?: string;
  filter?: 'all' | 'low' | 'out';
  page?: number;
  limit?: number;
}) {
  return useErpList<InventoryItem>('erp/inventory/items', params);
}

export function useInventoryStats() {
  return useErpResource<InventoryStats>('erp/inventory/stats');
}

export function useInventoryCategories(params?: Record<string, unknown>) {
  return useErpList<InventoryCategory>('erp/inventory/categories', params);
}

export function useInventoryStores(params?: Record<string, unknown>) {
  return useErpList<InventoryStore>('erp/inventory/stores', params);
}

// ─── Create item ──────────────────────────────────────────────────────────────

export function useCreateInventoryItem() {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInventoryItemPayload) =>
      post(`/organizations/${orgId}/erp/inventory/items`, payload).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/items'],
      });
      void qc.invalidateQueries({
        queryKey: [
          ...erpKey(orgId, branchId),
          'erp/inventory/stats',
          'one',
          {},
        ],
      });
    },
  });
}

// ─── Update item ──────────────────────────────────────────────────────────────

export function useUpdateInventoryItem(itemId: string) {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInventoryItemPayload) =>
      patch(
        `/organizations/${orgId}/erp/inventory/items/${itemId}`,
        payload,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/items'],
      });
    },
  });
}

// ─── Adjust stock ─────────────────────────────────────────────────────────────

export function useAdjustStock(itemId: string) {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustStockPayload) =>
      post(
        `/organizations/${orgId}/erp/inventory/items/${itemId}/adjust`,
        payload,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/items'],
      });
      void qc.invalidateQueries({
        queryKey: [
          ...erpKey(orgId, branchId),
          'erp/inventory/stats',
          'one',
          {},
        ],
      });
    },
  });
}

// ─── Create store ─────────────────────────────────────────────────────────────

export function useCreateStore() {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStorePayload) =>
      post(`/organizations/${orgId}/erp/inventory/stores`, payload).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/stores'],
      });
    },
  });
}

// ─── Update store ─────────────────────────────────────────────────────────────

export function useUpdateStore(storeId: string) {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStorePayload) =>
      patch(
        `/organizations/${orgId}/erp/inventory/stores/${storeId}`,
        payload,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/stores'],
      });
    },
  });
}

// ─── Delete (archive) store ───────────────────────────────────────────────────

export function useDeleteStore() {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      deleteBranchId,
    }: {
      storeId: string;
      deleteBranchId: string;
    }) =>
      del(
        `/organizations/${orgId}/erp/inventory/stores/${storeId}?branchId=${deleteBranchId}`,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/stores'],
      });
    },
  });
}

// ─── Archive item ─────────────────────────────────────────────────────────────

export function useArchiveInventoryItem() {
  const { orgId, branchId } = useErpContext();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      archiveBranchId,
    }: {
      itemId: string;
      archiveBranchId: string;
    }) =>
      del(
        `/organizations/${orgId}/erp/inventory/items/${itemId}?branchId=${archiveBranchId}`,
      ).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...erpKey(orgId, branchId), 'erp/inventory/items'],
      });
      void qc.invalidateQueries({
        queryKey: [
          ...erpKey(orgId, branchId),
          'erp/inventory/stats',
          'one',
          {},
        ],
      });
    },
  });
}

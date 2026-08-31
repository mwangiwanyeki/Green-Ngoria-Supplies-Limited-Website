import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StoredBranch {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface BranchState {
  branches: StoredBranch[];
  activeBranchId: string | null;
  setBranches: (branches: StoredBranch[]) => void;
  setActiveBranch: (id: string) => void;
  clear: () => void;
}

/**
 * Global branch selection for the admin ERP. Persisted to localStorage
 * and mirrored on `window` so the axios request interceptor can attach
 * an `X-Branch-Id` header without importing React state.
 */
export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branches: [],
      activeBranchId: null,
      setBranches: (branches) => {
        set((s) => {
          const stillValid = branches.find((b) => b.id === s.activeBranchId);
          const next =
            stillValid?.id ??
            branches.find((b) => b.isDefault)?.id ??
            branches[0]?.id ??
            null;
          if (typeof window !== 'undefined') {
            window.__GNG_ACTIVE_BRANCH_ID = next ?? undefined;
          }
          return { branches, activeBranchId: next };
        });
      },
      setActiveBranch: (id) => {
        if (typeof window !== 'undefined') {
          window.__GNG_ACTIVE_BRANCH_ID = id;
        }
        set({ activeBranchId: id });
      },
      clear: () => {
        if (typeof window !== 'undefined') {
          delete window.__GNG_ACTIVE_BRANCH_ID;
        }
        set({ branches: [], activeBranchId: null });
      },
    }),
    {
      name: 'gng-active-branch',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeBranchId: s.activeBranchId }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined' && state.activeBranchId) {
          window.__GNG_ACTIVE_BRANCH_ID = state.activeBranchId;
        }
      },
    },
  ),
);

declare global {
  interface Window {
    __GNG_ACTIVE_BRANCH_ID?: string;
  }
}

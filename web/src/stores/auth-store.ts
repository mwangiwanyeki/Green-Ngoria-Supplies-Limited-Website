import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  organizationId?: string;
}

interface AuthState {
  accessToken: string | null;
  user: StoredUser | null;
  authReady: boolean;
  // Setters
  setUser: (user: StoredUser) => void;
  setAccessToken: (access: string) => void;
  setAuthReady: (ready: boolean) => void;
  clearTokens: () => void;
  // Derived helpers
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  organizationId: () => string | undefined;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      authReady: false,

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setAuthReady: (authReady) => set({ authReady }),

      clearTokens: () => set({ accessToken: null, user: null }),

      isAuthenticated: () => {
        return !!get().accessToken && !!get().user;
      },

      hasRole: (role) => {
        return get().user?.roles?.includes(role) ?? false;
      },

      hasAnyRole: (roles) => {
        const userRoles = get().user?.roles ?? [];
        return roles.some((r) => userRoles.includes(r));
      },

      organizationId: () => get().user?.organizationId,
    }),
    {
      name: 'gng-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist only non-sensitive display data. Tokens stay in memory/HttpOnly cookies.
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

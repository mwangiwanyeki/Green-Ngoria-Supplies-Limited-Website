'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { post, get, patch, del } from '../api-client';
import { QK } from '../query-keys';
import { useAuthStore, type StoredUser } from '@/stores/auth-store';

export type { StoredUser as AuthUser };

// Full profile record returned by GET /users/me (superset of StoredUser).
export interface MyProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status: string;
  emailVerifiedAt?: string | null;
  mfaEnabled: boolean;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
  userRoles?: { role: { name: string; displayName: string } }[];
}

export interface ActiveSession {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface LoginResponse {
  // Present on a fully-authenticated response.
  accessToken?: string;
  expiresIn?: string;
  user?: StoredUser;
  // Present when the backend issues an MFA challenge instead of a session.
  requiresMfa?: boolean;
  message?: string;
}

// Local query key for the full profile record (distinct from the lightweight
// QK.me() identity used across the app).
const PROFILE_QK = ['auth', 'profile'] as const;

// ─── useMe — fetch current user profile ──────────────────────────────────
export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: QK.me(),
    queryFn: () =>
      get<StoredUser>('/auth/me').then((r) => {
        setUser(r.data);
        return r.data;
      }),
    // Enable if we have a token OR a persisted user (will refresh on failure)
    enabled: !!accessToken || !!storedUser,
    retry: false,
    staleTime: 5 * 60_000,
    // Return persisted user immediately as initial data
    initialData: storedUser ?? undefined,
    initialDataUpdatedAt: 0, // always re-fetch to keep fresh
  });
}

// ─── useLogin ─────────────────────────────────────────────────────────────
export function useLogin() {
  const qc = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      post<LoginResponse>('/auth/login', payload).then((r) => r.data),
    onSuccess: (data) => {
      // An MFA challenge resolves successfully but carries no session yet —
      // nothing to seed until the user submits their code.
      if (data.requiresMfa || !data.accessToken || !data.user) return;
      // Store access token in-memory window global (never localStorage)
      if (typeof window !== 'undefined') {
        window.__GNG_ACCESS_TOKEN = data.accessToken;
      }
      setAccessToken(data.accessToken);
      setUser(data.user);
      // Seed query cache
      qc.setQueryData(QK.me(), data.user);
    },
  });
}

// ─── useLogout ────────────────────────────────────────────────────────────
export function useLogout() {
  const qc = useQueryClient();
  const clearTokens = useAuthStore((s) => s.clearTokens);

  return useMutation({
    mutationFn: () => post('/auth/logout'),
    onSettled: () => {
      clearTokens();
      if (typeof window !== 'undefined') {
        delete window.__GNG_ACCESS_TOKEN;
      }
      qc.clear();
    },
  });
}

// ─── useRegister ──────────────────────────────────────────────────────────
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      post('/auth/register', payload).then((r) => r.data),
  });
}

// ─── useChangePassword ────────────────────────────────────────────────────
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      post('/auth/change-password', payload).then((r) => r.data),
  });
}

// ─── useForgotPassword ────────────────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      post('/auth/forgot-password', { email }).then((r) => r.data),
  });
}

// ─── useResetPassword ────────────────────────────────────────────────────
export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { token: string; password: string }) =>
      post('/auth/reset-password', payload).then((r) => r.data),
  });
}

// ─── useVerifyEmail ───────────────────────────────────────────────────────
export interface VerifyEmailResult {
  message: string;
  status?: 'verified' | 'already-verified';
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) =>
      get<VerifyEmailResult>(
        `/auth/verify-email?token=${encodeURIComponent(token)}`,
      ).then((r) => r.data),
  });
}

// ─── useMyProfile — full account record for the profile page ───────────────
export function useMyProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const storedUser = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: PROFILE_QK,
    queryFn: () => get<MyProfile>('/users/me').then((r) => r.data),
    enabled: !!accessToken || !!storedUser,
    staleTime: 60_000,
  });
}

// ─── useUpdateProfile ─────────────────────────────────────────────────────
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const storedUser = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      patch<MyProfile>('/users/me', payload).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_QK, data);
      void qc.invalidateQueries({ queryKey: QK.me() });
      if (storedUser) {
        setUser({
          ...storedUser,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }
    },
  });
}

// ─── MFA enrollment ───────────────────────────────────────────────────────
export interface MfaSetupResult {
  secret: string;
  otpauthUrl: string;
}

export function useMfaSetup() {
  return useMutation({
    mutationFn: () =>
      post<MfaSetupResult>('/auth/mfa/setup').then((r) => r.data),
  });
}

export function useMfaEnable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      post('/auth/mfa/enable', { code }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROFILE_QK });
    },
  });
}

export function useMfaDisable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      post('/auth/mfa/disable', { code }).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PROFILE_QK });
    },
  });
}

// ─── useSessions ─────────────────────────────────────────────────────────
export function useSessions() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: QK.sessions(),
    queryFn: () => get<ActiveSession[]>('/auth/sessions').then((r) => r.data),
    enabled: !!accessToken,
  });
}

// ─── useRevokeSession — sign out one specific session ─────────────────────
export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      del(`/auth/sessions/${sessionId}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.sessions() });
    },
  });
}

// ─── useLogoutAll — revoke every session (sign out other devices) ─────────
export function useLogoutAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => post('/auth/logout-all').then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.sessions() });
    },
  });
}

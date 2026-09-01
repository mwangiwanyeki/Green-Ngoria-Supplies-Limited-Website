import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from 'axios';
import { ApiError } from './api-error';

// ─── Base URL ─────────────────────────────────────────────────────────────
// In development: calls backend directly at http://localhost:3000/api/v1
// In production:  calls https://api.greenngoria.com/api/v1
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000')
  .replace(/\/api\/v1\/?$/, '')
  .replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/api/v1`;

// ─── Axios instance ────────────────────────────────────────────────────────
export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Token getter — reads from Zustand store (SSR-safe) ──────────────────
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.__GNG_ACCESS_TOKEN ?? null;
}

let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ data: { accessToken: string } }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((response) => {
        const accessToken = response.data.data.accessToken;
        if (typeof window !== 'undefined') {
          window.__GNG_ACCESS_TOKEN = accessToken;
        }
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// ─── Request interceptor ──────────────────────────────────────────────────
httpClient.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();

  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach active branch selection for ERP-scoped endpoints.
  if (typeof window !== 'undefined' && window.__GNG_ACTIVE_BRANCH_ID) {
    config.headers['X-Branch-Id'] = window.__GNG_ACTIVE_BRANCH_ID;
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────
httpClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as Record<string, unknown> | undefined;

    // ── Network error (backend unreachable / ECONNREFUSED) ─────────────────
    // Axios sets error.code = 'ERR_NETWORK' and error.message = 'Network Error'
    // when the server is not reachable. Surface a clear message.
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      return Promise.reject(
        new ApiError(
          0,
          'Unable to reach the server. Please check your connection or try again shortly.',
        ),
      );
    }

    const message =
      (data?.message as string) ?? error.message ?? 'Request failed';
    const errors = Array.isArray(data?.errors)
      ? (data.errors as unknown[])
      : undefined;
    const path = error.config?.url;

    // ── Auto-refresh on 401 ─────────────────────────────────────────────────
    if (status === 401 && typeof window !== 'undefined') {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retried?: boolean;
      };

      // Only retry once to avoid infinite loops
      if (
        !originalRequest._retried &&
        !originalRequest.url?.endsWith('/auth/refresh')
      ) {
        originalRequest._retried = true;

        try {
          const newAccess = await refreshAccessToken();

          // Retry the original request with the new token
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccess}`,
          };
          return httpClient(originalRequest);
        } catch {
          // Refresh failed — clear session and redirect
          clearAuthAndRedirect();
          return Promise.reject(
            new ApiError(401, 'Session expired. Please log in again.'),
          );
        }
      }

      // If retried and still 401, redirect to login
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/auth')) {
        clearAuthAndRedirect();
      }
    }

    return Promise.reject(
      new ApiError(status, message, errors, path ?? undefined),
    );
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────

function clearAuthAndRedirect(): void {
  try {
    localStorage.removeItem('gng-auth');
    delete window.__GNG_ACCESS_TOKEN;
  } catch {
    /* ignore */
  }
  const path = window.location.pathname;
  if (path.startsWith('/admin') || path.startsWith('/portal')) {
    window.location.href = `/auth/login?redirect=${encodeURIComponent(path)}`;
  }
}

// ─── Typed request helpers ────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.get<ApiResponse<T>>(url, config);
  return res.data;
}

export async function post<T = unknown>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.post<ApiResponse<T>>(url, data, config);
  return res.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.patch<ApiResponse<T>>(url, data, config);
  return res.data;
}

export async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.put<ApiResponse<T>>(url, data, config);
  return res.data;
}

export async function del<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.delete<ApiResponse<T>>(url, config);
  return res.data;
}

export async function upload<T>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  const res = await httpClient.post<ApiResponse<T>>(url, formData, {
    ...config,
    headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ─── Global token storage (in-memory, never persisted) ───────────────────
declare global {
  interface Window {
    __GNG_ACCESS_TOKEN?: string;
  }
}

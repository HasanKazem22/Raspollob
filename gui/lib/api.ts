import { setCookie, deleteCookie } from './utils/cookies';

/**
 * Where the Spring Boot server lives. Set at build time:
 * - development: unset, so http://localhost:8085
 * - Docker / VPS: "" (empty), so requests go to the same domain and Nginx forwards /api and /uploads
 */
export const BACKEND_SERVER_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8085';
export const API_BASE_URL = `${BACKEND_SERVER_URL}/api/v1`;

/** Standard response envelope. apiFetch always resolves to this shape. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

/** Spring Data page, as returned by paginated endpoints. */
export interface Page<T> {
  content: T[];
  last: boolean;
  totalElements: number;
  number: number;
}

/** Thrown by apiFetch for any non-2xx response or network failure. */
export class ApiError extends Error {
  /** HTTP status; undefined when the server could not be reached at all */
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** True when the request never reached the server (offline, server down, CORS). */
export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === undefined;
}

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return BACKEND_SERVER_URL + url;
  if (url.startsWith('uploads/')) return `${BACKEND_SERVER_URL}/${url}`;
  if (url.startsWith('/api/v1/')) return API_BASE_URL + url.substring(7);
  if (!url.startsWith('/')) return `${BACKEND_SERVER_URL}/uploads/${url}`;
  return `${BACKEND_SERVER_URL}${url}`;
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
  _retry?: boolean;
}

function clearSession() {
  deleteCookie('auth_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  localStorage.removeItem('role_permission');
}

/**
 * Calls the backend and resolves to `{ success: true, data, message }`.
 * Endpoints are relative to API_BASE_URL (e.g. "/products", not "/api/v1/products").
 * Rejects with ApiError on failure so callers' try/catch and toast.promise work.
 */
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : API_BASE_URL + endpoint;

  const headers = new Headers(options.headers || {});

  // Only add Content-Type if it's not a FormData request
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Handle Authentication
  if (options.requireAuth !== false) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      headers.set('Authorization', 'Bearer ' + token);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error: any) {
    console.warn('Fetch error:', error);
    throw new ApiError(error?.message || 'Network error');
  }

  // Handle 401 Unauthorized globally
  if (response.status === 401 && !options._retry && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && !endpoint.includes('/auth/refresh')) {
      options._retry = true;
      try {
        const refreshRes = await fetch(API_BASE_URL + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.accessToken) {
          localStorage.setItem('access_token', refreshData.accessToken);
          setCookie('auth_token', refreshData.accessToken);
          if (refreshData.refreshToken) {
            localStorage.setItem('refresh_token', refreshData.refreshToken);
          }
          return apiFetch(endpoint, options);
        }
      } catch (e) {
        // Refresh failed
      }
    }

    // If we get here, token refresh failed or wasn't available
    if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      // The cookie must go too, otherwise middleware bounces /login back to /
      clearSession();
      window.location.href = '/login';
    }
    throw new ApiError('Authentication required', 401);
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = text;
  }

  if (!response.ok) {
    console.warn('API Error:', response.status, data);
    throw new ApiError(data?.message || 'API request failed', response.status);
  }

  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success === false) {
      throw new ApiError(data.message || 'API request failed', response.status);
    }
    return data;
  }

  // Raw (unwrapped) backend responses get the standard envelope
  return { success: true, data };
}

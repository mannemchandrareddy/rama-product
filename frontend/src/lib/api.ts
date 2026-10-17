/**
 * API client — typed HTTP calls to the FastAPI backend.
 */

import { supabase } from './supabase';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = rawApiUrl.replace(/\/+$/, '');

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('auth_token');
    if (localToken) {
      return { Authorization: `Bearer ${localToken}` };
    }
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // Ignore supabase session errors
  }
  return {};
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Unable to reach API at ${API_URL}. Make sure the backend server is running.`
    );
  }

  let data: T & { error?: { message?: string }; detail?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid response from ${path} (${res.status})`);
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.detail || 'Something went wrong';
    throw new Error(typeof message === 'string' ? message : 'Something went wrong');
  }

  return data;
}

function getStoredCoords(): { lat: string | null; lng: string | null } {
  if (typeof window !== 'undefined') {
    return {
      lat: localStorage.getItem('user_lat'),
      lng: localStorage.getItem('user_lng'),
    };
  }
  return { lat: null, lng: null };
}

// ── Auth ──
export const api = {
  auth: {
    register: (data: Record<string, unknown>) =>
      request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: Record<string, unknown>) =>
      request('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    sync: () => request('/api/v1/auth/sync', { method: 'POST' }),
    me: () => request('/api/v1/auth/me'),
    updateProfile: (data: Record<string, unknown>) =>
      request('/api/v1/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    sendOtp: (data: { identifier: string; purpose?: string; name?: string; role?: string }) =>
      request('/api/v1/auth/otp/send', { method: 'POST', body: JSON.stringify(data) }),
    verifyOtp: (data: { identifier: string; otp: string; purpose?: string; name?: string; role?: string }) =>
      request('/api/v1/auth/otp/verify', { method: 'POST', body: JSON.stringify(data) }),
    submitFeedback: (data: { rating: number; tags: string[]; comment?: string; user_name?: string }) =>
      request('/api/v1/auth/feedback', { method: 'POST', body: JSON.stringify(data) }),
  },


  // ── Search ──
  search: {
    products: (params: Record<string, string | number | boolean | undefined>) => {
      const searchParams = new URLSearchParams();
      const coords = getStoredCoords();
      if (!params.latitude && coords.lat) params.latitude = coords.lat;
      if (!params.longitude && coords.lng) params.longitude = coords.lng;

      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.set(key, String(val));
        }
      });
      return request(`/api/v1/search?${searchParams.toString()}`);
    },
    suggestions: (q: string) =>
      request(`/api/v1/search/suggestions?q=${encodeURIComponent(q)}`),
  },

  // ── Products ──
  products: {
    list: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      return request(`/api/v1/products?${searchParams.toString()}`);
    },
    get: (id: string, lat?: number, lng?: number) => {
      const params = new URLSearchParams();
      const coords = getStoredCoords();
      const finalLat = lat != null ? String(lat) : coords.lat;
      const finalLng = lng != null ? String(lng) : coords.lng;
      if (finalLat) params.set('latitude', String(finalLat));
      if (finalLng) params.set('longitude', String(finalLng));
      return request(`/api/v1/products/${id}?${params.toString()}`);
    },
    create: (data: Record<string, unknown>) =>
      request('/api/v1/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ── Stores ──
  stores: {
    list: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      const coords = getStoredCoords();
      if (params && !params.latitude && coords.lat) params.latitude = coords.lat;
      if (params && !params.longitude && coords.lng) params.longitude = coords.lng;

      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      return request(`/api/v1/stores?${searchParams.toString()}`);
    },
    get: (id: string, lat?: number, lng?: number) => {
      const params = new URLSearchParams();
      const coords = getStoredCoords();
      const finalLat = lat != null ? String(lat) : coords.lat;
      const finalLng = lng != null ? String(lng) : coords.lng;
      if (finalLat) params.set('latitude', String(finalLat));
      if (finalLng) params.set('longitude', String(finalLng));
      return request(`/api/v1/stores/${id}?${params.toString()}`);
    },
    create: (data: Record<string, unknown>) =>
      request('/api/v1/stores', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/v1/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getMy: () => request('/api/v1/stores/my'),
    updateApproval: (id: string, status: string) =>
      request(`/api/v1/stores/${id}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approval_status: status }),
      }),
  },

  // ── Categories ──
  categories: {
    list: () => request('/api/v1/categories'),
    listAll: () => request('/api/v1/categories/all'),
    create: (data: Record<string, unknown>) =>
      request('/api/v1/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  // ── Listings ──
  listings: {
    create: (data: Record<string, unknown>) =>
      request('/api/v1/listings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request(`/api/v1/listings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getMy: (params?: Record<string, string | number>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          searchParams.set(key, String(val));
        });
      }
      return request(`/api/v1/listings/my?${searchParams.toString()}`);
    },
    listAll: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      return request(`/api/v1/listings?${searchParams.toString()}`);
    },
  },

  // ── Merchants ──
  merchants: {
    createProfile: (data: Record<string, unknown>) =>
      request('/api/v1/merchants/profile', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request('/api/v1/merchants/me'),
    updateMe: (data: Record<string, unknown>) =>
      request('/api/v1/merchants/me', { method: 'PUT', body: JSON.stringify(data) }),
    list: (params?: Record<string, string | number>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          searchParams.set(key, String(val));
        });
      }
      return request(`/api/v1/merchants?${searchParams.toString()}`);
    },
  },

  // ── Reports ──
  reports: {
    create: (data: Record<string, unknown>) =>
      request('/api/v1/reports', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      return request(`/api/v1/reports?${searchParams.toString()}`);
    },
    updateStatus: (id: string, status: string) =>
      request(`/api/v1/reports/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    stats: () => request('/api/v1/reports/stats'),
  },

  // ── Users (admin) ──
  users: {
    list: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            searchParams.set(key, String(val));
          }
        });
      }
      return request(`/api/v1/users?${searchParams.toString()}`);
    },
    get: (id: string) => request(`/api/v1/users/${id}`),
    toggleActive: (id: string) =>
      request(`/api/v1/users/${id}/toggle-active`, { method: 'PUT' }),
  },

  // ── Admin ──
  admin: {
    stats: () => request('/api/v1/admin/stats'),
  },

  // ── Events ──
  events: {
    log: (data: Record<string, unknown>) =>
      request('/api/v1/events', { method: 'POST', body: JSON.stringify(data) }),
    stats: (days?: number) => {
      const params = new URLSearchParams();
      if (days) params.set('days', String(days));
      return request(`/api/v1/events/stats?${params.toString()}`);
    },
  },
};

/**
 * Shared TypeScript types for the Local Commerce Intelligence Platform.
 */

// ── Enums ──
export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LIMITED' | 'UNKNOWN';
export type ReportType = 'WRONG_PRICE' | 'OUT_OF_STOCK' | 'WRONG_ADDRESS' | 'STORE_CLOSED' | 'WRONG_PRODUCT' | 'OTHER';
export type ReportStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';

// ── User ──
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Merchant ──
export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  created_at: string;
  updated_at: string;
}

// ── Store ──
export interface Store {
  id: string;
  merchant_id: string;
  name: string;
  phone?: string;
  description?: string;
  address?: string;
  village?: string;
  town?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  email?: string;
  whatsapp_number?: string;
  rating?: number;
  rating_count?: number;
  opening_time?: string;
  closing_time?: string;
  drive_time_mins?: number;
  walk_time_mins?: number;
  is_active: boolean;
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  distance_km?: number;
  listings?: StoreListing[];
  total_listings?: number;
}

// ── Category ──
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Product ──
export interface Product {
  id: string;
  category_id?: string;
  name: string;
  brand?: string;
  model?: string;
  description?: string;
  image_url?: string;
  search_keywords?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  listings?: ProductListingDetail[];
  total_listings?: number;
}

// ── Listing ──
export interface ProductListing {
  id: string;
  store_id: string;
  product_id: string;
  price: number;
  mrp?: number;
  stock_status: StockStatus;
  is_active: boolean;
  image_url?: string;
  product_image_url?: string;
  last_updated: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_brand?: string;
  store_name?: string;
  distance_km?: number;
}

export interface StoreListing {
  id: string;
  product_id: string;
  product_name?: string;
  product_brand?: string;
  product_image_url?: string;
  image_url?: string;
  price: number;
  mrp?: number;
  stock_status: StockStatus;
  last_updated: string;
}

export interface ProductListingDetail {
  listing_id: string;
  store_id: string;
  store_name: string;
  store_phone?: string;
  store_whatsapp?: string;
  store_rating?: number;
  store_rating_count?: number;
  store_opening_time?: string;
  store_closing_time?: string;
  store_city?: string;
  store_address?: string;
  store_latitude?: number;
  store_longitude?: number;
  price: number;
  mrp?: number;
  stock_status: StockStatus;
  listing_image_url?: string;
  last_updated: string;
  distance_km?: number;
  drive_time_mins?: number;
  walk_time_mins?: number;
}

// ── Search ──
export interface SearchResult {
  product_id: string;
  product_name: string;
  product_brand?: string;
  product_model?: string;
  product_image_url?: string;
  category_name?: string;
  listing_id: string;
  store_id: string;
  store_name: string;
  store_phone?: string;
  store_whatsapp?: string;
  store_rating?: number;
  store_rating_count?: number;
  store_city?: string;
  price: number;
  mrp?: number;
  stock_status: StockStatus;
  distance_km?: number;
  drive_time_mins?: number;
  walk_time_mins?: number;
  last_updated: string;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  category_name?: string;
  lowest_price?: number;
}

// ── Report ──
export interface Report {
  id: string;
  user_id?: string;
  store_id?: string;
  product_id?: string;
  listing_id?: string;
  report_type: ReportType;
  description?: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

// ── API Response ──
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// ── Admin Stats ──
export interface AdminStats {
  users: {
    total: number;
    customers: number;
    merchants: number;
  };
  stores: {
    total: number;
    pending: number;
    approved: number;
  };
  products: number;
  active_listings: number;
  reports: {
    open: number;
    reviewing: number;
    resolved: number;
    dismissed: number;
    total: number;
  };
}

/**
 * Application-wide constants. Brand name is centralized here for easy renaming.
 */

export const APP_NAME = 'LocalMart';
export const APP_TAGLINE = 'Find products at nearby stores';
export const APP_DESCRIPTION = 'Discover products available at physical stores near you. Compare prices, check availability, and get directions.';

export const STOCK_STATUS_LABELS: Record<string, string> = {
  IN_STOCK: 'Available',
  OUT_OF_STOCK: 'Out of Stock',
  LIMITED: 'Limited Stock',
  UNKNOWN: 'Check with Store',
};

export const STOCK_STATUS_COLORS: Record<string, string> = {
  IN_STOCK: 'text-emerald-700 bg-emerald-50 border border-emerald-200/60',
  OUT_OF_STOCK: 'text-red-700 bg-red-50 border border-red-200/60',
  LIMITED: 'text-amber-700 bg-amber-50 border border-amber-200/60',
  UNKNOWN: 'text-neutral-600 bg-neutral-100 border border-neutral-200/60',
};

export const REPORT_TYPE_LABELS: Record<string, string> = {
  WRONG_PRICE: 'Incorrect Price',
  OUT_OF_STOCK: 'Product Unavailable',
  WRONG_ADDRESS: 'Incorrect Address',
  STORE_CLOSED: 'Store Closed',
  WRONG_PRODUCT: 'Incorrect Product Info',
  OTHER: 'Other Issue',
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  APPROVED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  REJECTED: 'text-red-700 bg-red-50 border-red-200',
};

// Category icons (emoji-based for V1, can switch to SVG/icon library later)
export const CATEGORY_ICONS: Record<string, string> = {
  electrical: '⚡',
  hardware: '🔧',
  plumbing: '🚰',
  grocery: '🛒',
  agriculture: '🌾',
  electronics: '📱',
  mobile: '📲',
  automotive: '🚗',
  stationery: '📝',
  'home-appliances': '🏠',
  'building-materials': '🧱',
  tools: '🛠️',
};

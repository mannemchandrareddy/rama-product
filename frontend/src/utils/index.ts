/**
 * Utility functions — formatting, distance, time.
 */

/**
 * Format price in Indian Rupees.
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format distance for display.
 */
export function formatDistance(km?: number | null): string {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Format datetime as human-readable "time ago" string.
 * Shows freshness of data for availability trust.
 */
export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m} min${m !== 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (seconds < 604800) {
    const d = Math.floor(seconds / 86400);
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Generate Google Maps directions URL.
 */
export function getDirectionsUrl(lat: number, lng: number, _storeName?: string): string {
  const destination = `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

/**
 * Generate tel: link for calling.
 */
export function getPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

/**
 * Truncate text to specified length.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate full address string from store fields.
 */
export function formatAddress(store: {
  address?: string;
  village?: string;
  town?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}): string {
  const parts = [
    store.address,
    store.village,
    store.town,
    store.city,
    store.district,
    store.state,
    store.pincode,
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Classname concatenation helper.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

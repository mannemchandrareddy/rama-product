'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useGeolocation, PRESET_LOCATIONS } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPrice, formatDistance, timeAgo, cn } from '@/utils';
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '@/lib/constants';
import type { SearchResult, Category, ApiResponse, PaginatedResponse } from '@/types';
import {
  Search as SearchIcon,
  MessageSquare,
  Store as StoreIcon,
  Star,
  ImageIcon,
  Navigation,
  MapPin,
  RefreshCw,
} from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const { latitude, longitude, locationName, isLoading: isLocLoading, requestLocation, setLocation } = useGeolocation();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const requestIdRef = useRef(0);

  // Filters
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'distance');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');

  const debouncedQuery = useDebounce(query, 300);

  // Sync query from URL if changed
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null && urlQ !== query) {
      setQuery(urlQ);
    }
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    api.categories.list()
      .then((res: unknown) => {
        const r = res as ApiResponse<Category[]>;
        if (r.success) setCategories(r.data);
      })
      .catch(() => {});
  }, []);

  // Search effect
  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);

    const executeSearch = async () => {
      try {
        const params: Record<string, string | number | boolean | undefined> = { page, page_size: 20 };
        if (debouncedQuery) params.q = debouncedQuery;
        if (categoryId) params.category_id = categoryId;
        if (sortBy) params.sort_by = sortBy;
        if (inStock) params.in_stock = true;
        if (latitude) params.latitude = latitude;
        if (longitude) params.longitude = longitude;

        const res = (await api.search.products(params)) as PaginatedResponse<SearchResult>;
        if (currentRequestId === requestIdRef.current) {
          if (res && res.success && res.data) {
            setResults(res.data);
            setTotal(res.pagination?.total || 0);
            setTotalPages(res.pagination?.total_pages || 0);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        if (currentRequestId === requestIdRef.current) {
          console.warn('Search error:', err instanceof Error ? err.message : err);
          setResults([]);
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    executeSearch();
  }, [debouncedQuery, categoryId, sortBy, inStock, latitude, longitude, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafc] text-[#111111]">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8">
          {/* Header Title */}
          <div className="mb-6">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Local Inventory Radar
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight mt-1">
              Search Products & Stores
            </h1>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-5 animate-fade-in-up">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a product, brand or model (e.g. Smartphone, Atta, Havells LED)..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm text-base text-[#0a0a0a] focus:outline-none focus:border-orange-500 transition-all font-medium"
                  id="search-input"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-bold text-sm shadow-md hover:shadow-orange-500/30 transition-all cursor-pointer"
              >
                Search
              </button>
            </div>
          </form>

          {/* ── REAL-TIME LOCATION & DISTANCE BANNER ── */}
          {latitude && longitude ? (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50/90 via-amber-50/80 to-orange-50/90 border border-orange-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-orange-700">
                      Real-Time GPS Active
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Live Accuracy
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0a0a0a] mt-0.5">
                    Showing exact distances from:{' '}
                    <span className="text-orange-700 underline decoration-dotted font-black">
                      {locationName || `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={isLocLoading}
                  className="px-3 py-1.5 rounded-xl bg-white border border-orange-300 text-xs font-bold text-orange-700 hover:bg-orange-50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', isLocLoading && 'animate-spin')} />
                  <span>{isLocLoading ? 'Locating...' : 'Refresh GPS'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">
                    Enable Location to see exact distance & driving time from stores
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    We calculate real-time driving/walking distance from your physical location to local shops.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={isLocLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white text-xs font-bold shadow-sm hover:shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isLocLoading ? 'Detecting GPS...' : 'Share Live Location'}</span>
                </button>
                {PRESET_LOCATIONS.slice(0, 2).map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => setLocation(loc.lat, loc.lng, loc.name)}
                    className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    {loc.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] shadow-sm outline-none"
              id="filter-category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] shadow-sm outline-none"
              id="filter-sort"
            >
              <option value="distance">📍 Nearest Store First</option>
              <option value="price_asc">Lowest Price</option>
              <option value="price_desc">Highest Price</option>
              <option value="updated">Recently Updated</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700 bg-white px-3.5 py-2 rounded-xl border border-[#e4e4e7] shadow-sm">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded accent-orange-600"
              />
              In Stock only
            </label>

            {!isLoading && results.length > 0 && (
              <span className="text-xs text-neutral-500 ml-auto font-medium">
                {total} local product{total !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          {/* Search Results */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-[#e4e4e7] animate-pulse h-28" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-16 rounded-3xl bg-white border border-[#e4e4e7] text-center shadow-sm animate-fade-in">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {query ? 'No products found' : 'Start searching'}
              </h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                {query
                  ? `We couldn't find any products matching "${query}". Try different keywords or broaden your filters.`
                  : 'Search for a product name, brand, or model to locate nearby physical stores.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item, idx) => {
                const hasDiscount = item.mrp && item.mrp > item.price;
                const discountPct = hasDiscount ? Math.round(((item.mrp! - item.price) / item.mrp!) * 100) : 0;
                const rawPhone = (item.store_whatsapp || item.store_phone || '').replace(/[^0-9]/g, '');
                const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
                const whatsappText = encodeURIComponent(
                  `Hi ${item.store_name}! I found ${item.product_name} on LocalMart for ${formatPrice(
                    item.price
                  )}. Is it available for delivery/pickup?`
                );
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappText}`;

                return (
                  <div
                    key={item.listing_id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-md transition-all animate-fade-in-up"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                      {/* Left: Product Media & Info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.product_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-[#a1a1aa]" />
                          )}
                          {hasDiscount && (
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[9px] font-black text-center py-0.5">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <Link
                            href={`/product/${item.product_id}`}
                            className="font-extrabold text-base text-[#0a0a0a] hover:text-[#ea580c] transition-colors line-clamp-1 block"
                          >
                            {item.product_name}
                          </Link>
                          {item.product_brand && (
                            <p className="text-xs font-semibold text-[#71717a]">
                              {item.product_brand}
                              {item.product_model ? ` · ${item.product_model}` : ''}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {item.category_name && (
                              <span className="px-2 py-0.5 rounded-md bg-[#fff7ed] text-[#ea580c] text-[10px] font-bold border border-[#ffedd5]">
                                {item.category_name}
                              </span>
                            )}
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                STOCK_STATUS_COLORS[item.stock_status]
                              )}
                            >
                              {STOCK_STATUS_LABELS[item.stock_status]}
                            </span>
                            <span className="text-[11px] text-[#a1a1aa]">
                              Updated {timeAgo(item.last_updated)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Store Details & Real-Time Distance */}
                      <div className="sm:border-l sm:border-[#f4f4f5] sm:pl-5 space-y-1.5 min-w-[210px]">
                        <Link
                          href={`/store/${item.store_id}`}
                          className="font-bold text-sm text-[#0a0a0a] hover:text-[#ea580c] transition-colors flex items-center gap-1.5"
                        >
                          <StoreIcon className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span className="truncate">{item.store_name}</span>
                        </Link>

                        <div className="flex items-center gap-2 text-xs text-[#71717a]">
                          <span className="font-bold text-[#0a0a0a] flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {item.store_rating || 4.7}
                          </span>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">Open Now</span>
                          {item.store_city && (
                            <>
                              <span>·</span>
                              <span>{item.store_city}</span>
                            </>
                          )}
                        </div>

                        {/* Exact Distance & Travel ETAs */}
                        {item.distance_km != null ? (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-black text-orange-700 bg-orange-50 border border-orange-200/90 px-2 py-0.5 rounded-lg">
                              📍 {formatDistance(item.distance_km)} away
                            </span>
                            {item.drive_time_mins && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-lg">
                                🚗 {item.drive_time_mins}m drive
                              </span>
                            )}
                            {item.walk_time_mins && item.walk_time_mins <= 45 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-lg">
                                🚶 {item.walk_time_mins}m walk
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={requestLocation}
                            className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 pt-0.5 underline underline-offset-2 cursor-pointer"
                          >
                            📍 Tap to see distance
                          </button>
                        )}
                      </div>

                      {/* Right: Price & Quick WhatsApp Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#f4f4f5]">
                        <div className="text-left sm:text-right">
                          <div className="flex items-baseline gap-1.5 sm:justify-end">
                            <span className="text-xl font-black text-[#0a0a0a]">
                              {formatPrice(item.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-neutral-400 line-through">
                                {formatPrice(item.mrp!)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#1fb855] text-white shadow-sm flex items-center gap-1 transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                          <Link
                            href={`/product/${item.product_id}`}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0a0a0a] hover:bg-[#27272a] text-white shadow-sm transition-all"
                          >
                            Compare
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] hover:bg-[#f4f4f5] disabled:opacity-40 transition-all cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs text-neutral-500 font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] hover:bg-[#f4f4f5] disabled:opacity-40 transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fafafc]">
          <div className="skeleton h-8 w-32 rounded-xl" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

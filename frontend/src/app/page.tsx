'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDistance, cn } from '@/utils';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Category, SearchSuggestion, ApiResponse, SearchResult } from '@/types';
import {
  Search,
  Sparkles,
  Zap,
  MessageSquare,
  Store as StoreIcon,
  Star,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Navigation,
  MapPin,
} from 'lucide-react';

const RICH_CATEGORIES = [
  { id: 'cat_grocery', name: 'Daily Groceries & Atta', icon: '🌾', gradient: 'from-amber-500/10 to-orange-500/10', border: 'border-orange-200' },
  { id: 'cat_dairy', name: 'Dairy, Milk & Bread', icon: '🥛', gradient: 'from-blue-500/10 to-sky-500/10', border: 'border-blue-200' },
  { id: 'cat_snacks', name: 'Munchies & Snacks', icon: '🍪', gradient: 'from-yellow-500/10 to-amber-500/10', border: 'border-yellow-200' },
  { id: 'cat_drinks', name: 'Cold Drinks & Juices', icon: '🥤', gradient: 'from-emerald-500/10 to-teal-500/10', border: 'border-emerald-200' },
  { id: 'cat_cleaning', name: 'Home & Cleaning', icon: '🧼', gradient: 'from-purple-500/10 to-indigo-500/10', border: 'border-purple-200' },
  { id: 'cat_electronics', name: 'Electronics & Mobiles', icon: '📱', gradient: 'from-rose-500/10 to-pink-500/10', border: 'border-rose-200' },
  { id: 'cat_electrical', name: 'Hardware & Electrical', icon: '⚡', gradient: 'from-orange-500/10 to-red-500/10', border: 'border-orange-200' },
  { id: 'cat_personal', name: 'Personal Care & Hygiene', icon: '🧴', gradient: 'from-teal-500/10 to-cyan-500/10', border: 'border-teal-200' },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<SearchResult[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { latitude, longitude, locationName } = useGeolocation();

  // Load Categories & Featured Data
  useEffect(() => {
    api.categories.list()
      .then((res: any) => {
        if (res.success && res.data?.length > 0) setCategories(res.data);
      })
      .catch(() => {});

    api.search.products({ in_stock: true, page_size: 4 })
      .then((res: any) => {
        if (res.success && res.data) setTrendingProducts(res.data);
      })
      .catch(() => {});

    api.stores.list({ page_size: 3 })
      .then((res: any) => {
        if (res.success && res.data) setFeaturedStores(res.data);
      })
      .catch(() => {});
  }, [latitude, longitude]);

  // Instant Predictive Search (Debounced)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = (await api.search.suggestions(searchQuery.trim())) as ApiResponse<SearchSuggestion[]>;
        if (res.success && res.data) {
          setSuggestions(res.data);
          setShowDropdown(res.data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (latitude) params.set('latitude', String(latitude));
    if (longitude) params.set('longitude', String(longitude));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafc] text-[#111111] antialiased">
      <Header />

      <main className="flex-1 space-y-12 sm:space-y-16 pb-16">
        {/* ── HERO SECTION: Apple Light Canvas + Zepto Velocity ── */}
        <section className="relative overflow-visible bg-dot-pattern pt-12 pb-16 sm:pt-20 sm:pb-24">
          {/* Ambient Glowing Orbs */}
          <div className="apple-glow-orb apple-glow-orb-primary w-[550px] h-[550px] -top-24 left-1/2 -translate-x-1/2" />
          <div className="apple-glow-orb apple-glow-orb-amber w-[400px] h-[400px] top-40 -left-20" />

          <div className="page-container relative z-20 text-center">
            {/* Live Counter Pill */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5 shadow-sm border border-orange-200 bg-white/90 backdrop-blur-md text-[#0a0a0a] animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span>Live Price Comparison across Verified Neighborhood Stores</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-[800] tracking-[-0.035em] text-[#0a0a0a] leading-[1.08] max-w-4xl mx-auto animate-fade-in-up">
              Find any product at nearby local stores
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#52525b] max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
              Compare actual shelf prices, check real-time stock availability, and order directly on WhatsApp or pick up in-store.
            </p>

            {/* ── INSTANT SEARCH BOX WITH PREDICTIVE SUGGESTIONS DROPDOWN ── */}
            <div ref={searchContainerRef} className="mt-8 max-w-2xl mx-auto relative animate-fade-in-up stagger-2">
              <form
                onSubmit={handleSearch}
                className="p-3 sm:p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-xl hover:border-orange-400/50 transition-all text-left relative z-30"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-neutral-400 shrink-0 ml-1" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Search product, brand, grocery, or hardware (e.g. Smartphone, Atta, LED)..."
                    className="w-full border-0 bg-transparent py-1 text-base text-[#0a0a0a] placeholder:text-neutral-400 focus:outline-none leading-relaxed font-medium"
                    id="home-search-input"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-bold text-xs shadow-md hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* ── PREDICTIVE SUGGESTIONS DROPDOWN (Zepto/Blinkit Style) ── */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#e4e4e7] shadow-2xl overflow-hidden z-40 text-left animate-slide-down">
                  <div className="p-2.5 bg-[#fafafc] border-b border-[#f4f4f5] flex items-center justify-between text-xs font-semibold text-[#71717a]">
                    <span>Suggested Products</span>
                    <span className="text-[11px] font-normal text-neutral-400">Press Enter for all results</span>
                  </div>
                  <div className="divide-y divide-[#f4f4f5] max-h-80 overflow-y-auto">
                    {suggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(`/product/${item.id}`);
                        }}
                        className="p-3.5 hover:bg-[#fff7ed] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#fafafc] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden">
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#0a0a0a] group-hover:text-[#ea580c] transition-colors truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#71717a] truncate">
                              {item.brand && <span>{item.brand} · </span>}
                              {item.category_name || 'In local stores'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {item.lowest_price ? (
                            <div>
                              <span className="text-xs font-bold text-emerald-600">From {formatPrice(item.lowest_price)}</span>
                              <span className="block text-[10px] text-neutral-400">Compare stores ➔</span>
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Context Pill */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-neutral-500 font-medium">📍 Searching stores near:</span>
                <span className="font-extrabold text-[#ea580c] bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {locationName || 'Detecting live GPS...'}
                </span>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
                <span className="font-semibold text-neutral-400">Trending Searches:</span>
                {['Smartphone', 'Atta 5kg', 'LED Bulb', 'Dairy Milk', 'Cement'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                    }}
                    className="rounded-full px-3 py-1 bg-white hover:bg-orange-50 hover:text-orange-700 text-neutral-700 font-semibold transition-all border border-[#e4e4e7] shadow-xs cursor-pointer"
                  >
                    &ldquo;{term}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 FLASH VALUE PROPOSITIONS (Blinkit / Zepto Style Value Cards) ── */}
        <section className="page-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#fff7ed] to-white border border-[#ffedd5] shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0a0a0a] text-base">Direct WhatsApp Orders</h3>
                <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                  Chat directly with local store owners on WhatsApp for doorstep delivery with zero platform markup.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#ecfdf5] to-white border border-[#d1fae5] shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0a0a0a] text-base">Save 10%–25% Locally</h3>
                <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                  Compare actual shelf prices across shops within 5 km to find who has the best deal right now.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#eff6ff] to-white border border-[#dbeafe] shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0a0a0a] text-base">Instant In-Store Pickup</h3>
                <p className="text-xs text-[#71717a] mt-1 leading-relaxed">
                  Verify stock status before stepping out so you never waste a trip to an out-of-stock store.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── RICH VISUAL CATEGORIES (Zepto Style Tiles) ── */}
        <section className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">Explore Categories</h2>
              <p className="text-xs text-[#71717a] mt-0.5">Top departments stocked across your neighborhood</p>
            </div>
            <Link href="/categories" className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {RICH_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category_id=${cat.id}`}
                className={cn(
                  'p-4 rounded-2xl bg-white border shadow-sm hover:shadow-md transition-all text-center flex flex-col items-center justify-between gap-2 group hover:-translate-y-1',
                  cat.border
                )}
              >
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br', cat.gradient)}>
                  <span className="group-hover:scale-125 transition-transform duration-200">{cat.icon}</span>
                </div>
                <span className="text-xs font-bold text-[#0a0a0a] group-hover:text-[#ea580c] transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── TRENDING PRODUCTS WITH LOCAL SAVINGS ── */}
        {trendingProducts.length > 0 && (
          <section className="page-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">Trending in Your Area</h2>
                <p className="text-xs text-[#71717a] mt-0.5">Verified active stock with current shelf prices</p>
              </div>
              <Link href="/search" className="text-xs font-bold text-[#ea580c] hover:underline flex items-center gap-1">
                <span>Browse All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingProducts.map((item) => {
                const hasDiscount = item.mrp && item.mrp > item.price;
                const discountPct = hasDiscount ? Math.round(((item.mrp! - item.price) / item.mrp!) * 100) : 0;

                return (
                  <div
                    key={item.listing_id}
                    className="p-5 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Thumbnail & Discount Badge */}
                      <div className="w-full h-40 rounded-2xl bg-[#fafafc] border border-[#f4f4f5] flex items-center justify-center overflow-hidden relative mb-4">
                        {item.product_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product_image_url}
                            alt={item.product_name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Sparkles className="w-8 h-8 text-neutral-300" />
                        )}
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold gap-1">
                          <p className="text-[#ea580c] flex items-center gap-1 truncate">
                            <StoreIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.store_name}</span>
                          </p>
                          {item.distance_km != null && (
                            <span className="text-[11px] font-bold text-neutral-800 bg-orange-100 px-1.5 py-0.5 rounded shrink-0">
                              📍 {formatDistance(item.distance_km)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-[#0a0a0a] group-hover:text-[#ea580c] transition-colors line-clamp-2">
                          {item.product_name}
                        </h3>
                        {item.product_brand && (
                          <p className="text-xs text-[#71717a]">{item.product_brand}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#f4f4f5] flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-[#0a0a0a]">{formatPrice(item.price)}</span>
                          {hasDiscount && (
                            <span className="text-xs text-neutral-400 line-through">{formatPrice(item.mrp!)}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600">In Stock Nearby</span>
                      </div>

                      <Link
                        href={`/product/${item.product_id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#0a0a0a] hover:bg-[#27272a] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        Compare
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── TOP NEIGHBORHOOD STORES ── */}
        {featuredStores.length > 0 && (
          <section className="page-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">Verified Local Stores</h2>
                <p className="text-xs text-[#71717a] mt-0.5">Top-rated merchant partners in your community</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredStores.map((store) => (
                <div
                  key={store.id}
                  className="p-6 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{store.rating || 4.7} ({store.rating_count || 48})</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Open Now
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-[#0a0a0a]">{store.name}</h3>
                    <p className="text-xs text-[#71717a] line-clamp-1">
                      📍 {store.address || store.city || 'Local Store'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#f4f4f5] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#ea580c]">
                      {store.phone || 'Phone verified'}
                    </span>
                    <Link
                      href={`/store/${store.id}`}
                      className="px-4 py-2 rounded-xl border border-[#e4e4e7] text-xs font-bold text-[#0a0a0a] hover:bg-[#f4f4f5] transition-all flex items-center gap-1"
                    >
                      <span>Visit Store</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

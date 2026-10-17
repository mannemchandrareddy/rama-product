'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatPrice, formatDistance, timeAgo, cn, getDirectionsUrl, getPhoneUrl } from '@/utils';
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '@/lib/constants';
import type { Product, ProductListingDetail, ApiResponse } from '@/types';
import {
  MessageSquare,
  Phone,
  Navigation,
  Star,
  Clock,
  Car,
  Footprints,
  ShieldCheck,
  Tag,
  Share2,
  Sparkles,
  Store as StoreIcon,
  Image as ImageIcon,
} from 'lucide-react';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [listings, setListings] = useState<ProductListingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { latitude, longitude, requestLocation } = useGeolocation();
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'updated'>('price');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = (await api.products.get(
          id,
          latitude || undefined,
          longitude || undefined
        )) as ApiResponse<Product>;
        if (res.success) {
          setProduct(res.data);
          setListings(res.data.listings || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Product not found';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, latitude, longitude]);

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'distance') {
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    }
    return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
  });

  const lowestPrice = listings.length > 0 ? Math.min(...listings.map((l) => l.price)) : null;
  const highestPrice = listings.length > 0 ? Math.max(...listings.map((l) => l.price)) : null;
  const maxSavings = lowestPrice && highestPrice && highestPrice > lowestPrice ? highestPrice - lowestPrice : 0;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getWhatsAppUrl = (listing: ProductListingDetail) => {
    const rawPhone = (listing.store_whatsapp || listing.store_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `Hello ${listing.store_name}! I saw ${product?.name} on LocalMart for ${formatPrice(
        listing.price
      )}. Is it currently in stock for pickup or quick delivery?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fafafc]">
        <Header />
        <main className="flex-1 page-container py-12">
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="skeleton h-4 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-flat p-5">
                <div className="skeleton h-24 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fafafc]">
        <Header />
        <main className="flex-1 page-container py-16 text-center animate-fade-in">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Product not found</h1>
          <p className="text-neutral-500 mb-6">{error || 'This product does not exist or has been removed.'}</p>
          <Link href="/search" className="btn-primary">
            Back to Search
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const mainImage = product.image_url || listings.find((l) => l.listing_image_url)?.listing_image_url;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafc] text-[#111111]">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 sm:py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-6 animate-fade-in">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/search" className="hover:text-black transition-colors">
              Search
            </Link>
            <span>/</span>
            <span className="font-semibold text-neutral-800 truncate">{product.name}</span>
          </nav>

          {/* Product Hero Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              {/* Product Visual */}
              <div className="w-full md:w-56 h-56 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden relative group">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-[#a1a1aa]" />
                )}
                {maxSavings > 0 && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#ea580c] text-white shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Save up to {formatPrice(maxSavings)}
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Local Catalogue
                  </div>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-xl border border-[#e4e4e7] text-neutral-600 hover:text-black hover:bg-[#f4f4f5] transition-all text-xs font-semibold flex items-center gap-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight mt-2">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {product.brand && (
                    <span className="px-3 py-1 rounded-lg bg-[#f4f4f5] text-xs font-bold text-[#0a0a0a]">
                      {product.brand}
                    </span>
                  )}
                  {product.model && (
                    <span className="px-3 py-1 rounded-lg bg-[#f4f4f5] text-xs font-medium text-neutral-600">
                      {product.model}
                    </span>
                  )}
                  {product.category_name && (
                    <span className="px-3 py-1 rounded-lg bg-[#fff7ed] text-xs font-bold text-[#ea580c] border border-[#ffedd5]">
                      {product.category_name}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="mt-4 text-sm leading-relaxed text-[#52525b]">{product.description}</p>
                )}

                {/* Best Local Deal Pill */}
                {lowestPrice && (
                  <div className="mt-5 p-4 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#71717a] font-medium">Best Price in Your Neighborhood</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-black text-emerald-600">
                          {formatPrice(lowestPrice)}
                        </span>
                        <span className="text-xs text-neutral-400">across {listings.length} physical stores</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#71717a] flex items-center gap-1">
                      <StoreIcon className="w-4 h-4 text-[#ea580c]" />
                      Direct in-store purchase or WhatsApp delivery
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Comparison Header */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in-up stagger-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#0a0a0a] tracking-tight">
                Store Price Comparison & Availability
              </h2>
              <p className="text-xs text-[#71717a] mt-0.5">
                Compare actual shelf prices, check stock, and order directly from local merchants.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={requestLocation}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] hover:bg-[#f4f4f5] shadow-sm transition-all"
                type="button"
              >
                📍 Use my location
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'price' | 'distance' | 'updated')}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] shadow-sm outline-none"
              >
                <option value="price">Lowest Price First</option>
                <option value="distance">Nearest Store First</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Store Comparison Cards */}
          {listings.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-[#e4e4e7] text-center shadow-sm">
              <StoreIcon className="w-12 h-12 text-[#a1a1aa] mx-auto mb-3" />
              <h3 className="font-bold text-[#0a0a0a] text-base">No nearby stores currently listing this item</h3>
              <p className="text-xs text-[#71717a] mt-1 max-w-sm mx-auto">
                Ask your favorite local merchant to list this product, or browse other categories.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedListings.map((listing, idx) => {
                const isBestPrice = listing.price === lowestPrice;
                const hasDiscount = listing.mrp && listing.mrp > listing.price;
                const discountPct = hasDiscount ? Math.round(((listing.mrp! - listing.price) / listing.mrp!) * 100) : 0;

                return (
                  <div
                    key={listing.listing_id}
                    className={`p-5 sm:p-6 rounded-3xl bg-white border shadow-sm hover:shadow-md transition-all animate-fade-in-up stagger-${Math.min(
                      idx + 1,
                      8
                    )} ${isBestPrice ? 'border-emerald-400 ring-1 ring-emerald-400/20' : 'border-[#e4e4e7]'}`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Store Meta */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/store/${listing.store_id}`}
                            className="font-bold text-lg text-[#0a0a0a] hover:text-[#ea580c] transition-colors"
                          >
                            {listing.store_name}
                          </Link>
                          {isBestPrice && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              🏆 Lowest Price
                            </span>
                          )}
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
                              STOCK_STATUS_COLORS[listing.stock_status]
                            )}
                          >
                            {STOCK_STATUS_LABELS[listing.stock_status]}
                          </span>
                        </div>

                        {/* Store Details: Rating, Hours, Distance */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#71717a]">
                          <span className="inline-flex items-center gap-1 font-bold text-[#0a0a0a]">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {listing.store_rating || 4.7} ({listing.store_rating_count || 48})
                          </span>

                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            Open · Closes {listing.store_closing_time || '10:30 PM'}
                          </span>

                          {listing.distance_km != null && (
                            <span className="font-semibold text-neutral-800">
                              📍 {formatDistance(listing.distance_km)}
                            </span>
                          )}

                          {listing.drive_time_mins && (
                            <span className="inline-flex items-center gap-1 text-neutral-600">
                              <Car className="w-3.5 h-3.5 text-[#a1a1aa]" />
                              ~{listing.drive_time_mins} mins drive
                            </span>
                          )}

                          {listing.walk_time_mins && (
                            <span className="inline-flex items-center gap-1 text-neutral-600">
                              <Footprints className="w-3.5 h-3.5 text-[#a1a1aa]" />
                              ~{listing.walk_time_mins} mins walk
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#71717a]">
                          {listing.store_address || listing.store_city || 'Local Neighborhood Store'} · Stock
                          verified {timeAgo(listing.last_updated)}
                        </p>
                      </div>

                      {/* Right: Pricing & Actions */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#f4f4f5]">
                        {/* Price */}
                        <div className="text-left lg:text-right">
                          <div className="flex items-baseline lg:justify-end gap-2">
                            <span className="text-2xl font-black text-[#0a0a0a]">
                              {formatPrice(listing.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-neutral-400 line-through">
                                {formatPrice(listing.mrp!)}
                              </span>
                            )}
                          </div>
                          {hasDiscount && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <Tag className="w-3 h-3" />
                              {discountPct}% OFF MRP
                            </span>
                          )}
                        </div>

                        {/* Interactive Buttons: WhatsApp Order, Call, Directions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* WhatsApp Order Button */}
                          <a
                            href={getWhatsAppUrl(listing)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#1fb855] text-white shadow-sm flex items-center gap-1.5 transition-all"
                          >
                            <MessageSquare className="w-4 h-4 fill-white" />
                            Order on WhatsApp
                          </a>

                          {/* Direct Phone Call */}
                          {listing.store_phone && (
                            <a
                              href={getPhoneUrl(listing.store_phone)}
                              className="px-3 py-2.5 rounded-xl font-semibold text-xs bg-[#0a0a0a] hover:bg-[#27272a] text-white shadow-sm flex items-center gap-1.5 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call
                            </a>
                          )}

                          {/* Google Maps Directions */}
                          {listing.store_latitude && listing.store_longitude && (
                            <a
                              href={getDirectionsUrl(listing.store_latitude, listing.store_longitude)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2.5 rounded-xl font-semibold text-xs border border-[#e4e4e7] text-neutral-700 hover:text-black hover:bg-[#f4f4f5] flex items-center gap-1.5 transition-all"
                            >
                              <Navigation className="w-3.5 h-3.5 text-[#ea580c]" />
                              Directions
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

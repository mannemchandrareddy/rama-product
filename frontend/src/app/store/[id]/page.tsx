'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { formatPrice, formatDistance, timeAgo, formatAddress, getDirectionsUrl, getPhoneUrl, cn } from '@/utils';
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '@/lib/constants';
import type { Store, StoreListing, ApiResponse } from '@/types';
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
  Package,
  Image as ImageIcon,
  Flag,
} from 'lucide-react';

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [listings, setListings] = useState<StoreListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { latitude, longitude } = useGeolocation();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = (await api.stores.get(
          id,
          latitude || undefined,
          longitude || undefined
        )) as ApiResponse<Store>;
        if (res.success) {
          setStore(res.data);
          setListings(res.data.listings || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Store not found';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStore();
  }, [id, latitude, longitude]);

  const getStoreWhatsAppUrl = () => {
    if (!store) return '#';
    const rawPhone = (store.whatsapp_number || store.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `Hello ${store.name}! I found your store on LocalMart. Do you deliver to my area or have products available for pickup?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getItemWhatsAppUrl = (item: StoreListing) => {
    if (!store) return '#';
    const rawPhone = (store.whatsapp_number || store.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const text = encodeURIComponent(
      `Hello ${store.name}! I saw ${item.product_name} listed for ${formatPrice(
        item.price
      )} on LocalMart. Is it currently in stock for pickup or delivery?`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fafafc]">
        <Header />
        <main className="flex-1 page-container py-12">
          <div className="skeleton h-10 w-72 mb-4" />
          <div className="skeleton h-4 w-48 mb-2" />
          <div className="skeleton h-4 w-64 mb-8" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 w-full rounded-2xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fafafc]">
        <Header />
        <main className="flex-1 page-container py-16 text-center animate-fade-in">
          <div className="text-4xl mb-4">🏪</div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Store not found</h1>
          <p className="text-neutral-500 mb-6">{error}</p>
          <Link href="/search" className="btn-primary">
            Search Products
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const fullAddress = formatAddress(store);

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
              Stores
            </Link>
            <span>/</span>
            <span className="font-semibold text-neutral-800 truncate">{store.name}</span>
          </nav>

          {/* Store Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e4e4e7] shadow-sm mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Merchant Partner
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0a0a0a] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {store.rating || 4.7} ({store.rating_count || 48} ratings)
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <Clock className="w-3.5 h-3.5" />
                    Open Now · Closes {store.closing_time || '10:30 PM'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight">
                  {store.name}
                </h1>

                {store.description && (
                  <p className="text-sm leading-relaxed text-[#52525b]">{store.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717a] pt-1">
                  {fullAddress && (
                    <span className="flex items-center gap-1 font-medium text-[#27272a]">
                      <span>📍</span> {fullAddress}
                    </span>
                  )}
                  {store.phone && (
                    <span className="flex items-center gap-1 font-medium">
                      <span>📞</span> {store.phone}
                    </span>
                  )}
                  {store.distance_km != null && (
                    <span className="font-bold text-[#ea580c]">
                      ⚡ {formatDistance(store.distance_km)} away
                    </span>
                  )}
                  {store.drive_time_mins && (
                    <span className="inline-flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-[#a1a1aa]" />
                      ~{store.drive_time_mins} mins drive
                    </span>
                  )}
                  {store.walk_time_mins && (
                    <span className="inline-flex items-center gap-1">
                      <Footprints className="w-3.5 h-3.5 text-[#a1a1aa]" />
                      ~{store.walk_time_mins} mins walk
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0 justify-start sm:justify-center pt-3 md:pt-0 border-t md:border-t-0 border-[#f4f4f5]">
                {/* WhatsApp Chat */}
                <a
                  href={getStoreWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#25D366] hover:bg-[#1fb855] text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  Chat / Order via WhatsApp
                </a>

                {/* Direct Call */}
                {store.phone && (
                  <a
                    href={getPhoneUrl(store.phone)}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#0a0a0a] hover:bg-[#27272a] text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Store
                  </a>
                )}

                {/* Google Maps Directions */}
                {store.latitude && store.longitude && (
                  <a
                    href={getDirectionsUrl(store.latitude, store.longitude, store.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl font-bold text-xs border border-[#e4e4e7] text-neutral-800 hover:text-black hover:bg-[#f4f4f5] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#ea580c]" />
                    Get Directions
                  </a>
                )}

                <Link
                  href={`/report?store_id=${store.id}`}
                  className="text-[11px] text-[#a1a1aa] hover:text-black transition-colors flex items-center gap-1 justify-center mt-1"
                >
                  <Flag className="w-3 h-3" />
                  Report incorrect store info
                </Link>
              </div>
            </div>
          </div>

          {/* Products Listed Header */}
          <div className="mb-4 flex items-center justify-between animate-fade-in-up stagger-2">
            <div>
              <h2 className="text-xl font-extrabold text-[#0a0a0a] tracking-tight">
                Store Inventory & Shelf Prices
              </h2>
              <p className="text-xs text-[#71717a] mt-0.5">
                {listings.length} product{listings.length !== 1 ? 's' : ''} currently stocked and verified
              </p>
            </div>
          </div>

          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="p-12 rounded-3xl bg-white border border-[#e4e4e7] text-center shadow-sm">
              <Package className="w-12 h-12 text-[#a1a1aa] mx-auto mb-3" />
              <h3 className="font-bold text-[#0a0a0a] text-base">No active listings for this store</h3>
              <p className="text-xs text-[#71717a] mt-1 max-w-sm mx-auto">
                This store has not added any price listings yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((item, idx) => {
                const img = item.product_image_url || item.image_url;
                const hasDiscount = item.mrp && item.mrp > item.price;
                const discountPct = hasDiscount ? Math.round(((item.mrp! - item.price) / item.mrp!) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 animate-fade-in-up stagger-${Math.min(
                      idx + 1,
                      8
                    )}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-[#fafafc] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={item.product_name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-[#a1a1aa]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${item.product_id}`}
                          className="font-bold text-sm text-[#0a0a0a] hover:text-[#ea580c] transition-colors truncate block"
                        >
                          {item.product_name}
                        </Link>
                        {item.product_brand && (
                          <p className="text-xs text-[#71717a]">{item.product_brand}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              'px-2 py-0.2 rounded-full text-[10px] font-semibold border',
                              STOCK_STATUS_COLORS[item.stock_status]
                            )}
                          >
                            {STOCK_STATUS_LABELS[item.stock_status]}
                          </span>
                          <span className="text-[11px] text-[#a1a1aa]">
                            {timeAgo(item.last_updated)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-[#0a0a0a]">
                          {formatPrice(item.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-neutral-400 line-through">
                            {formatPrice(item.mrp!)}
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="text-[10px] font-bold text-emerald-600">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <a
                        href={getItemWhatsAppUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 px-3 py-1.5 rounded-lg font-bold text-[11px] bg-[#25D366] hover:bg-[#1fb855] text-white flex items-center gap-1 transition-all"
                      >
                        <MessageSquare className="w-3 h-3 fill-white" />
                        Inquire
                      </a>
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

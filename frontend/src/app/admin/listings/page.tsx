'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice, timeAgo, cn } from '@/utils';
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '@/lib/constants';
import type { ProductListing, PaginatedResponse } from '@/types';
import { Layers, Store as StoreIcon, Image as ImageIcon, Power, RefreshCw } from 'lucide-react';

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 20 };
      const res = (await api.listings.listAll(params)) as PaginatedResponse<ProductListing>;
      if (res.success) {
        setListings(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.total_pages);
          setTotal(res.pagination.total);
        }
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const toggleActive = async (listing: ProductListing) => {
    setTogglingId(listing.id);
    try {
      await api.listings.update(listing.id, { is_active: !listing.is_active });
      await loadListings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update listing';
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Active Store Listings
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Global inventory items mapped across registered merchant storefronts.
          </p>
        </div>
        {!isLoading && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e4e4e7] shadow-sm text-xs font-semibold text-[#0a0a0a]">
            <Layers className="w-3.5 h-3.5 text-[#f97316]" />
            <span>{total} Total Listings</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <Layers className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No store listings found</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            Listings will appear here as soon as merchants add products to their inventories.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#e4e4e7] shadow-sm overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f4f4f5] bg-[#fafafc]">
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Product</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Merchant Store</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a] text-right">Price</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Stock</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Updated</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4f4f5]">
                  {listings.map((listing) => {
                    const isBusy = togglingId === listing.id;
                    const img = listing.image_url || listing.product_image_url;

                    return (
                      <tr
                        key={listing.id}
                        className={cn(
                          'hover:bg-[#fafafc] transition-colors',
                          !listing.is_active && 'opacity-60 bg-[#fbfbfb]'
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={img}
                                  alt={listing.product_name || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#a1a1aa]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0a0a0a] truncate">
                                {listing.product_name || 'Unknown Product'}
                              </p>
                              {listing.product_brand && (
                                <p className="text-xs text-[#71717a] truncate">
                                  {listing.product_brand}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-[#27272a]">
                            <StoreIcon className="w-3.5 h-3.5 text-[#f97316]" />
                            <span>{listing.store_name || 'Unknown Store'}</span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-emerald-600">
                            {formatPrice(listing.price)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                              STOCK_STATUS_COLORS[listing.stock_status]
                            )}
                          >
                            {STOCK_STATUS_LABELS[listing.stock_status] || listing.stock_status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-xs text-[#71717a]">
                          {timeAgo(listing.last_updated)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              listing.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                listing.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                              }`}
                            />
                            {listing.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            disabled={isBusy}
                            onClick={() => toggleActive(listing)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 inline-flex items-center gap-1',
                              listing.is_active
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            )}
                          >
                            <Power className="w-3 h-3" />
                            {listing.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {listings.map((listing) => {
              const img = listing.image_url || listing.product_image_url;
              return (
                <div
                  key={listing.id}
                  className={cn(
                    'p-4 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm space-y-3',
                    !listing.is_active && 'opacity-60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center shrink-0 overflow-hidden">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={listing.product_name || 'Product'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-[#a1a1aa]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#0a0a0a] truncate">
                        {listing.product_name || 'Unknown Product'}
                      </h4>
                      <p className="text-xs text-[#71717a]">{listing.product_brand}</p>
                      <p className="text-xs text-[#f97316] font-medium mt-0.5 flex items-center gap-1">
                        <StoreIcon className="w-3 h-3" />
                        {listing.store_name}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatPrice(listing.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#f4f4f5]">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                        STOCK_STATUS_COLORS[listing.stock_status]
                      )}
                    >
                      {STOCK_STATUS_LABELS[listing.stock_status]}
                    </span>

                    <button
                      onClick={() => toggleActive(listing)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                        listing.is_active
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      )}
                    >
                      {listing.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#e4e4e7] shadow-sm">
              <p className="text-xs font-medium text-[#71717a]">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] hover:bg-[#f4f4f5] disabled:opacity-40 transition-all"
                >
                  ← Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-xl border border-[#e4e4e7] text-xs font-semibold text-[#0a0a0a] hover:bg-[#f4f4f5] disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, timeAgo, cn } from '@/utils';
import { STOCK_STATUS_LABELS, STOCK_STATUS_COLORS } from '@/lib/constants';
import type { ProductListing, PaginatedResponse } from '@/types';

export default function MerchantProductsPage() {
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editImage, setEditImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      const res = (await api.listings.getMy({ page: 1, page_size: 100 })) as PaginatedResponse<ProductListing>;
      if (res.success) setListings(res.data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const startEdit = (listing: ProductListing) => {
    setEditingId(listing.id || (listing as any)._id);
    setEditPrice(listing.price.toString());
    setEditStock(listing.stock_status);
    setEditImage(listing.image_url || listing.product_image_url || '');
  };

  const saveEdit = async (listingId: string) => {
    setIsSaving(true);
    try {
      const data: Record<string, unknown> = {};
      if (editPrice) data.price = parseFloat(editPrice);
      if (editStock) data.stock_status = editStock;
      data.image_url = editImage.trim() || undefined;
      await api.listings.update(listingId, data);
      setEditingId(null);
      loadListings();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (listing: ProductListing) => {
    try {
      const listingId = listing.id || (listing as any)._id;
      await api.listings.update(listingId, { is_active: !listing.is_active });
      loadListings();
    } catch {}
  };

  if (isLoading) {
    return <div className="space-y-3"><div className="skeleton h-8 w-48 mb-4" />{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Product Catalogue Listings</h1>
          <p className="text-xs text-neutral-500 mt-1">Manage price, photos, and availability for each product in your store</p>
        </div>
        <Link href="/merchant/products/new" className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold">
          <span>➕</span> Add Listing
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="apple-glow-card py-16 text-center animate-fade-in bg-white max-w-lg mx-auto p-8">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-bold text-lg mb-2 text-[#0a0a0a]">No products listed yet</h3>
          <p className="text-xs text-neutral-500 mb-6">Start by adding your first product from the local catalogue to appear in search results.</p>
          <Link href="/merchant/products/new" className="btn-primary inline-flex px-6 py-2.5 rounded-xl font-semibold text-xs">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="apple-glow-card overflow-hidden bg-white border-black/[0.08] shadow-sm animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50/80 border-b border-black/[0.06]">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Your Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Stock Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Last Updated</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {listings.map((listing) => {
                  const listingId = listing.id || (listing as any)._id;
                  const img = listing.image_url || listing.product_image_url;
                  return (
                    <tr key={listingId} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-black/[0.08] overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt={listing.product_name || 'Product'} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <span className="text-xl">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#0a0a0a] truncate">{listing.product_name}</div>
                            {listing.product_brand && <div className="text-xs text-neutral-500 mt-0.5">{listing.product_brand}</div>}
                            {editingId === listingId && (
                              <input
                                value={editImage}
                                onChange={(e) => setEditImage(e.target.value)}
                                placeholder="Image URL..."
                                className="input-field text-xs py-1 mt-1.5 w-full max-w-xs"
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {editingId === listingId ? (
                          <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="input-field w-28 text-xs py-1.5" type="number" step="0.01" min="0" />
                        ) : (
                          <span className="font-bold text-base text-emerald-700">{formatPrice(listing.price)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {editingId === listingId ? (
                          <select value={editStock} onChange={(e) => setEditStock(e.target.value)} className="select-field w-36 text-xs py-1.5">
                            <option value="IN_STOCK">Available</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                            <option value="LIMITED">Limited</option>
                          </select>
                        ) : (
                          <span className={cn('badge text-xs px-3 py-1 font-semibold rounded-full', STOCK_STATUS_COLORS[listing.stock_status] || 'bg-neutral-100 text-neutral-700')}>
                            {STOCK_STATUS_LABELS[listing.stock_status] || listing.stock_status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-400">{timeAgo(listing.last_updated)}</td>
                      <td className="px-5 py-4 text-right">
                        {editingId === listingId ? (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => saveEdit(listingId)} disabled={isSaving} className="btn-primary text-xs px-3 py-1 rounded-lg">Save</button>
                            <button onClick={() => setEditingId(null)} className="btn-secondary text-xs px-3 py-1 rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => startEdit(listing)} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                              Edit
                            </button>
                            <button onClick={() => toggleActive(listing)} className={cn("inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold transition-colors", listing.is_active ? "text-amber-700 bg-amber-50 hover:bg-amber-100" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100")}>
                              {listing.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

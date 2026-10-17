'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Store, ProductListing } from '@/types';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS, STOCK_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/utils';

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [merchantExists, setMerchantExists] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if merchant profile exists
        const merchantRes: any = await api.merchants.getMe();
        if (!merchantRes.success) {
          setMerchantExists(false);
          return;
        }

        const storesRes: any = await api.stores.getMy();
        if (storesRes.success) setStores(storesRes.data);

        const listingsRes: any = await api.listings.getMy({ page: 1, page_size: 50 });
        if (listingsRes.success) setListings(listingsRes.data);
      } catch {
        setMerchantExists(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!merchantExists) {
    return (
      <div className="text-center py-16 animate-fade-in-up apple-glow-card p-10 max-w-xl mx-auto">
        <div className="text-5xl mb-4">🏪</div>
        <h2 className="text-2xl font-bold mb-2 text-[#0a0a0a]">Create your merchant profile</h2>
        <p className="mb-6 text-sm text-neutral-500 max-w-md mx-auto">Set up your business profile to start listing products and becoming discoverable by local customers.</p>
        <Link href="/merchant/store" className="btn-primary inline-flex px-6 py-2.5 rounded-xl font-semibold">
          Create Profile & Store
        </Link>
      </div>
    );
  }

  const totalListings = listings.length;
  const inStockCount = listings.filter(l => l.stock_status === 'IN_STOCK').length;
  const outOfStockCount = listings.filter(l => l.stock_status === 'OUT_OF_STOCK').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Merchant Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage your storefronts, catalogue items, and pricing in real time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: totalListings, icon: '📦', color: 'text-blue-600 bg-blue-50 border-blue-200/60' },
          { label: 'In Stock', value: inStockCount, icon: '✅', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
          { label: 'Out of Stock', value: outOfStockCount, icon: '⚠️', color: 'text-amber-600 bg-amber-50 border-amber-200/60' },
          { label: 'Active Stores', value: stores.length, icon: '🏪', color: 'text-purple-600 bg-purple-50 border-purple-200/60' },
        ].map((stat, i) => (
          <div key={stat.label} className={`apple-glow-card p-5 animate-fade-in-up stagger-${i + 1} flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stat.label}</span>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <span className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Store Status */}
      {stores.length > 0 && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0a0a0a]">Your Stores</h2>
            <Link href="/merchant/store" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
              Manage Store →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((store) => (
              <div key={store.id} className="apple-glow-card p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-[#0a0a0a] text-base">{store.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">{store.city || store.town || 'No location set'} · {store.phone || 'No phone'}</p>
                </div>
                <span className={cn('badge text-xs px-3 py-1 font-semibold rounded-full border', APPROVAL_STATUS_COLORS[store.approval_status])}>
                  {APPROVAL_STATUS_LABELS[store.approval_status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/merchant/products/new" className="apple-glow-card p-6 group hover:border-orange-500/30 transition-all flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl font-bold border border-orange-200/50 flex-shrink-0 group-hover:scale-105 transition-transform">
            ➕
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0a0a0a] group-hover:text-orange-600 transition-colors">Add Product Listing</h3>
            <p className="text-xs text-neutral-500 mt-1">Select from product catalogue and set your price and stock level</p>
          </div>
        </Link>
        <Link href="/merchant/products" className="apple-glow-card p-6 group hover:border-orange-500/30 transition-all flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold border border-blue-200/50 flex-shrink-0 group-hover:scale-105 transition-transform">
            📋
          </div>
          <div>
            <h3 className="font-bold text-base text-[#0a0a0a] group-hover:text-blue-600 transition-colors">Manage Product Listings</h3>
            <p className="text-xs text-neutral-500 mt-1">Review live products, edit prices, and toggle stock availability</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

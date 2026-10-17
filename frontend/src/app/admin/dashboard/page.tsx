'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { AdminStats, ApiResponse } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.admin.stats()
      .then((res: unknown) => { const r = res as ApiResponse<AdminStats>; if (r.success) setStats(r.data); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 apple-glow-card p-10 max-w-md mx-auto">
        <p className="text-sm font-semibold text-neutral-500">Failed to load platform statistics.</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.users.total, icon: '👥', color: 'text-blue-600 bg-blue-50 border-blue-200/60' },
    { label: 'Customers', value: stats.users.customers, icon: '🛒', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
    { label: 'Merchants', value: stats.users.merchants, icon: '🏪', color: 'text-purple-600 bg-purple-50 border-purple-200/60' },
    { label: 'Total Stores', value: stats.stores.total, icon: '📍', color: 'text-indigo-600 bg-indigo-50 border-indigo-200/60' },
    { label: 'Pending Stores', value: stats.stores.pending, icon: '⏳', color: 'text-amber-600 bg-amber-50 border-amber-200/60' },
    { label: 'Approved Stores', value: stats.stores.approved, icon: '✅', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60' },
    { label: 'Catalog Products', value: stats.products, icon: '📦', color: 'text-orange-600 bg-orange-50 border-orange-200/60' },
    { label: 'Active Listings', value: stats.active_listings, icon: '📋', color: 'text-teal-600 bg-teal-50 border-teal-200/60' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">Admin Dashboard</h1>
        <p className="text-xs text-neutral-500 mt-1">Platform-wide real-time metrics and moderation queues</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className={`apple-glow-card p-5 animate-fade-in-up stagger-${Math.min(i + 1, 8)} flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{stat.label}</span>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <span className="text-3xl font-extrabold text-[#0a0a0a] tracking-tight">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Reports Summary */}
      <div className="apple-glow-card p-6 sm:p-8 animate-fade-in-up">
        <h2 className="text-lg font-bold text-[#0a0a0a] mb-4">Consumer Reports Queue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-2xl bg-red-50 border border-red-200">
            <div className="text-3xl font-extrabold text-red-700">{stats.reports.open}</div>
            <div className="text-xs font-bold text-red-600 mt-1 uppercase tracking-wider">Open</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-3xl font-extrabold text-amber-700">{stats.reports.reviewing}</div>
            <div className="text-xs font-bold text-amber-600 mt-1 uppercase tracking-wider">Reviewing</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="text-3xl font-extrabold text-emerald-700">{stats.reports.resolved}</div>
            <div className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">Resolved</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-neutral-100 border border-neutral-200">
            <div className="text-3xl font-extrabold text-neutral-800">{stats.reports.total}</div>
            <div className="text-xs font-bold text-neutral-600 mt-1 uppercase tracking-wider">Total Filed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

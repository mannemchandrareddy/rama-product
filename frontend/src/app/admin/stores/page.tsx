'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/utils';
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from '@/lib/constants';
import type { Store, PaginatedResponse } from '@/types';
import { Store as StoreIcon, CheckCircle2, XCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 20 };
      if (filter) params.approval_status = filter;
      const res = (await api.stores.list(params)) as PaginatedResponse<Store>;
      if (res.success) {
        setStores(res.data);
        setTotal(res.pagination?.total ?? res.data.length);
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleApproval = async (storeId: string, status: string) => {
    setUpdatingId(storeId);
    try {
      await api.stores.updateApproval(storeId, status);
      await loadStores();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update approval';
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Store Approvals & Management
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Review, verify, and approve partner merchant stores.
          </p>
        </div>
        {!isLoading && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#e4e4e7] shadow-sm text-xs font-semibold text-[#0a0a0a]">
            <StoreIcon className="w-3.5 h-3.5 text-[#f97316]" />
            <span>{total} Total Stores</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm w-fit animate-fade-in stagger-1">
        {[
          { label: 'All Stores', val: '' },
          { label: 'Pending Review', val: 'PENDING' },
          { label: 'Approved', val: 'APPROVED' },
          { label: 'Rejected', val: 'REJECTED' },
        ].map((tab) => {
          const isActive = filter === tab.val;
          return (
            <button
              key={tab.val}
              onClick={() => {
                setFilter(tab.val);
                setPage(1);
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-[#0a0a0a] text-white shadow-sm'
                  : 'text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <StoreIcon className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No stores found</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            {filter
              ? `There are no stores currently marked as ${filter}.`
              : 'No merchant stores have registered in the platform yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((store: Store & { _id?: string }, idx) => {
            const storeId = store.id || store._id || '';
            const isProcessing = updatingId === storeId;

            return (
              <div
                key={storeId}
                className={`p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  8
                )}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#fff7ed] border border-[#ffedd5] flex items-center justify-center shrink-0 text-[#ea580c] font-bold text-lg">
                    {store.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-[#0a0a0a] truncate">
                        {store.name}
                      </h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                          store.approval_status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : store.approval_status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        {APPROVAL_STATUS_LABELS[store.approval_status] || store.approval_status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717a]">
                      {(store.address || store.city || store.town) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          {[store.address, store.city || store.town, store.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {store.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          {store.phone}
                        </span>
                      )}
                      {store.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          {store.email}
                        </span>
                      )}
                      {store.created_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#a1a1aa]" />
                          {new Date(store.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#f4f4f5] shrink-0">
                  {store.approval_status !== 'APPROVED' && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproval(storeId, 'APPROVED')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  )}
                  {store.approval_status !== 'REJECTED' && (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproval(storeId, 'REJECTED')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

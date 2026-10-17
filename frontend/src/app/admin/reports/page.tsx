'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { timeAgo, cn } from '@/utils';
import { REPORT_TYPE_LABELS } from '@/lib/constants';
import type { Report, PaginatedResponse } from '@/types';
import { AlertTriangle, CheckCircle2, Clock, Eye, XCircle } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, page_size: 50 };
      if (filter) params.status = filter;
      const res = (await api.reports.list(params)) as PaginatedResponse<Report>;
      if (res.success) setReports(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateStatus = async (reportId: string, status: string) => {
    setUpdatingId(reportId);
    try {
      await api.reports.updateStatus(reportId, status);
      await loadReports();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Open
          </span>
        );
      case 'REVIEWING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Under Review
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
            Dismissed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Customer & Store Reports
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Community flags on inaccurate pricing, out-of-stock items, or store issues.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm w-fit animate-fade-in stagger-1">
        {[
          { label: 'All Reports', val: '' },
          { label: 'Open', val: 'OPEN' },
          { label: 'Reviewing', val: 'REVIEWING' },
          { label: 'Resolved', val: 'RESOLVED' },
          { label: 'Dismissed', val: 'DISMISSED' },
        ].map((tab) => {
          const isActive = filter === tab.val;
          return (
            <button
              key={tab.val}
              onClick={() => setFilter(tab.val)}
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No reports found</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            {filter ? `No reports currently marked as ${filter}.` : 'There are no active issue reports.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, idx) => {
            const isBusy = updatingId === report.id;
            return (
              <div
                key={report.id}
                className={`p-5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in-up stagger-${Math.min(
                  idx + 1,
                  8
                )}`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#f4f4f5] text-xs font-semibold text-[#0a0a0a]">
                      {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                    {getStatusBadge(report.status)}
                    <span className="text-xs text-[#71717a] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#a1a1aa]" />
                      {timeAgo(report.created_at)}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-sm text-[#27272a] font-medium leading-relaxed">
                      {report.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  {report.status === 'OPEN' && (
                    <button
                      disabled={isBusy}
                      onClick={() => updateStatus(report.id, 'REVIEWING')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review
                    </button>
                  )}
                  {(report.status === 'OPEN' || report.status === 'REVIEWING') && (
                    <>
                      <button
                        disabled={isBusy}
                        onClick={() => updateStatus(report.id, 'RESOLVED')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                      <button
                        disabled={isBusy}
                        onClick={() => updateStatus(report.id, 'DISMISSED')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#71717a] hover:text-[#0a0a0a] hover:bg-[#f4f4f5] transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Dismiss
                      </button>
                    </>
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

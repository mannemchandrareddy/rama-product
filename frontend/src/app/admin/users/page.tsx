'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/utils';
import type { User, PaginatedResponse } from '@/types';
import { Users, Shield, Store, UserCheck, Power } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: 30 };
      if (roleFilter) params.role = roleFilter;
      const res = (await api.users.list(params)) as PaginatedResponse<User>;
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const toggleUserActive = async (userId: string) => {
    setTogglingId(userId);
    try {
      await api.users.toggleActive(userId);
      await loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user status';
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'MERCHANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Store className="w-3 h-3" />
            Merchant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <UserCheck className="w-3 h-3" />
            Customer
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
            User Management
          </h1>
          <p className="text-sm text-[#71717a] mt-1">
            Accounts across all roles: Customers, Merchants, and Admins.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-[#e4e4e7] shadow-sm w-fit animate-fade-in stagger-1">
        {[
          { label: 'All Users', val: '' },
          { label: 'Customers', val: 'CUSTOMER' },
          { label: 'Merchants', val: 'MERCHANT' },
          { label: 'Admins', val: 'ADMIN' },
        ].map((tab) => {
          const isActive = roleFilter === tab.val;
          return (
            <button
              key={tab.val}
              onClick={() => {
                setRoleFilter(tab.val);
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

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-white border border-[#e4e4e7] animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] p-12 text-center shadow-sm">
          <Users className="w-10 h-10 text-[#a1a1aa] mx-auto mb-3" />
          <h3 className="font-semibold text-[#0a0a0a] text-base">No users found</h3>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm mx-auto">
            No accounts found with role filter &quot;{roleFilter || 'All'}&quot;.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e4e4e7] shadow-sm overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f4f4f5] bg-[#fafafc]">
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">User</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Email</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Role</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a]">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#71717a] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5]">
                {users.map((user) => {
                  const isBusy = togglingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-[#fafafc] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4f4f5] border border-[#e4e4e7] flex items-center justify-center font-bold text-xs text-[#0a0a0a]">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#0a0a0a]">
                              {user.name || 'Unnamed User'}
                            </p>
                            {user.phone && (
                              <p className="text-xs text-[#71717a]">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-[#52525b]">
                        {user.email || '—'}
                      </td>

                      <td className="px-5 py-3.5">
                        {getRoleBadge(user.role)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          disabled={isBusy}
                          onClick={() => toggleUserActive(user.id)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 inline-flex items-center gap-1',
                            user.is_active
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          )}
                        >
                          <Power className="w-3 h-3" />
                          {user.is_active ? 'Suspend' : 'Activate'}
                        </button>
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

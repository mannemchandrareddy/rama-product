'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { cn } from '@/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, role, router]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="skeleton h-8 w-32" /></div>;
  if (!isAuthenticated || role !== 'ADMIN') return null;

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/stores', label: 'Stores', icon: '🏪' },
    { href: '/admin/products', label: 'Products', icon: '📦' },
    { href: '/admin/listings', label: 'Listings', icon: '📋' },
    { href: '/admin/categories', label: 'Categories', icon: '📂' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/reports', label: 'Reports', icon: '🚩' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafc]">
      <Header />
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-black/[0.08] bg-white/70 backdrop-blur-xl">
          <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Admin Control</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
              Admin
            </span>
          </div>
          <nav className="flex-1 p-3 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden w-full">
          <div className="border-b border-black/[0.06] bg-white/80 backdrop-blur-md overflow-x-auto">
            <nav className="flex px-4 py-2 gap-1.5 min-w-max">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]'
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="p-4 sm:p-6">{children}</div>
        </div>

        {/* Desktop Main Content */}
        <div className="hidden lg:block flex-1 p-8 overflow-auto bg-[#fafafc]">
          {children}
        </div>
      </div>
    </div>
  );
}

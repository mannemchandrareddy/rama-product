'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import LogoutFeedbackModal from '@/components/layout/LogoutFeedbackModal';

export default function ProfilePage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [logoutFeedbackOpen, setLogoutFeedbackOpen] = useState(false);
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 page-container py-8">
          <div className="skeleton h-8 w-48 mb-4" />
          <div className="skeleton h-32 w-full rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await api.auth.updateProfile({ name: name || user?.name, phone: phone || user?.phone });
      setMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 max-w-2xl">
          <h1 className="page-title mb-6 animate-fade-in">Profile</h1>

          <div className="card-flat p-6 animate-fade-in-up">
            {message && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7' }}>{message}</div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', color: '#fff' }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>{user?.name}</h2>
                <p className="text-sm" style={{ color: '#64748b' }}>{user?.email}</p>
                <span className="badge mt-1" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{user?.role}</span>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder={user?.name}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field"
                    placeholder={user?.phone || 'Your phone number'}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm" style={{ color: '#64748b' }}>Name</span>
                  <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user?.name}</span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm" style={{ color: '#64748b' }}>Email</span>
                  <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user?.email}</span>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-sm" style={{ color: '#64748b' }}>Phone</span>
                  <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user?.phone || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm" style={{ color: '#64748b' }}>Role</span>
                  <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{user?.role}</span>
                </div>
                <div className="flex gap-2 pt-4">
                  <button onClick={() => { setName(user?.name || ''); setPhone(user?.phone || ''); setIsEditing(true); }} className="btn-secondary">
                    Edit Profile
                  </button>
                  <button onClick={() => setLogoutFeedbackOpen(true)} className="btn-ghost" style={{ color: '#f87171' }}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <LogoutFeedbackModal
        isOpen={logoutFeedbackOpen}
        onClose={() => setLogoutFeedbackOpen(false)}
        onSuccess={() => router.push('/')}
      />
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { REPORT_TYPE_LABELS } from '@/lib/constants';

function ReportContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const storeId = searchParams.get('store_id') || undefined;
  const productId = searchParams.get('product_id') || undefined;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 page-container py-16 text-center animate-fade-in">
          <h1 className="text-xl font-semibold mb-2" style={{ color: '#f1f5f9' }}>Sign in to report an issue</h1>
          <p className="mb-6" style={{ color: '#64748b' }}>You need an account to submit reports.</p>
          <button onClick={() => router.push('/login')} className="btn-primary">Sign in</button>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await api.reports.create({
        report_type: reportType,
        description,
        store_id: storeId,
        product_id: productId,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit report';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 page-container py-16 text-center animate-fade-in-up">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: '#f1f5f9' }}>Report submitted</h1>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Thank you. Our team will review this shortly.</p>
          <button onClick={() => router.back()} className="btn-primary">Go back</button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 max-w-lg">
          <h1 className="page-title mb-2 animate-fade-in">Report an Issue</h1>
          <p className="mb-6 animate-fade-in stagger-1" style={{ color: '#64748b' }}>Help us keep information accurate</p>

          <div className="card-flat p-6 animate-fade-in-up stagger-2">
            {error && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">What&apos;s the issue?</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="select-field" required>
                  <option value="">Select issue type</option>
                  {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-[100px]"
                  placeholder="Describe the issue..."
                  maxLength={2000}
                />
              </div>
              <button type="submit" disabled={isSubmitting || !reportType} className="btn-primary w-full py-3">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ReportContent />
    </Suspense>
  );
}

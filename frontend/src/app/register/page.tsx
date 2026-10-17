'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';
import type { UserRole } from '@/types';
import { ShieldCheck, Smartphone, CheckCircle2, ArrowRight, RefreshCw, Store, ShoppingBag } from 'lucide-react';
import { cn } from '@/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Auto-focus first digit on verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!identifier.trim()) {
      setError('Please enter your mobile number or email address');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await sendOtp(identifier.trim(), 'register', name.trim(), role);
      if (res.success) {
        setStep('verify');
        setCountdown(30);
        setCanResend(false);
        if (res.otp) {
          setDemoOtp(res.otp);
        }
      } else {
        setError(res.message || 'Failed to send verification code.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit typing
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const clean = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillDemoOtp = () => {
    if (demoOtp && demoOtp.length === 6) {
      setOtpDigits(demoOtp.split(''));
    }
  };

  // Handle Verify & Create Account
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await verifyOtp(identifier.trim(), enteredCode, 'register', name.trim(), role);
      if (role === 'MERCHANT') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP code';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative overflow-hidden bg-dot-pattern">
      {/* Apple glowing ambient orbs */}
      <div className="apple-glow-orb apple-glow-orb-primary w-96 h-96 -top-20 -left-20" />
      <div className="apple-glow-orb apple-glow-orb-amber w-96 h-96 -bottom-20 -right-20" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] shadow-sm">
              L
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0a0a0a]">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">
            {step === 'verify' ? 'Verify Your Account' : 'Create an Account'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {step === 'verify'
              ? `Enter the 6-digit OTP code sent to ${identifier}`
              : 'Join as a Customer or Verified Neighborhood Merchant'}
          </p>
        </div>

        <div className="apple-glow-card p-6 sm:p-8 bg-white shadow-xl border-black/[0.08] rounded-3xl">
          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 animate-shake">
              {error}
            </div>
          )}

          {step === 'verify' ? (
            /* ── STEP 2: 6-DIGIT OTP VERIFICATION ── */
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              {demoOtp && (
                <div
                  onClick={handleAutoFillDemoOtp}
                  className="p-3 rounded-2xl bg-orange-50 border border-orange-200/90 text-orange-800 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-orange-100/70 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📩</span>
                    <span>Demo Code: <span className="font-mono text-sm underline tracking-widest">{demoOtp}</span></span>
                  </div>
                  <span className="text-[11px] uppercase bg-orange-200/70 px-2 py-0.5 rounded-md font-extrabold">Tap to Fill</span>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div>
                <label className="label text-xs font-bold text-neutral-800 text-center block mb-3">
                  6-Digit OTP Code
                </label>
                <div className="flex items-center justify-between gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={idx === 0 ? 6 : 1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-12 h-14 text-center text-xl font-extrabold rounded-2xl border border-[#e4e4e7] bg-[#fafafc] focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all text-[#0a0a0a]"
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Timer & Change Details */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('details');
                    setError('');
                  }}
                  className="text-neutral-500 hover:text-black font-semibold cursor-pointer underline underline-offset-2"
                >
                  Change Details
                </button>

                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="text-neutral-400 font-medium">
                    Resend in <span className="font-bold text-neutral-600">{countdown}s</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-extrabold text-sm shadow-md hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Creating Account...' : 'Verify OTP & Finish Registration'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ── STEP 1: ACCOUNT DETAILS & ROLE SELECTION ── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="label text-xs font-bold text-neutral-800 mb-2 block">I want to join as</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={cn(
                      'rounded-2xl p-3.5 text-center transition-all cursor-pointer border flex flex-col items-center gap-1',
                      role === 'CUSTOMER'
                        ? 'bg-orange-50/80 border-orange-500 shadow-sm text-orange-950 font-bold ring-2 ring-orange-500/10'
                        : 'bg-white border-[#e4e4e7] text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    <ShoppingBag className={cn('w-6 h-6', role === 'CUSTOMER' ? 'text-orange-600' : 'text-neutral-400')} />
                    <div className="text-xs font-bold">Shopper</div>
                    <div className="text-[10px] text-neutral-500">Find & buy locally</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('MERCHANT')}
                    className={cn(
                      'rounded-2xl p-3.5 text-center transition-all cursor-pointer border flex flex-col items-center gap-1',
                      role === 'MERCHANT'
                        ? 'bg-orange-50/80 border-orange-500 shadow-sm text-orange-950 font-bold ring-2 ring-orange-500/10'
                        : 'bg-white border-[#e4e4e7] text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    <Store className={cn('w-6 h-6', role === 'MERCHANT' ? 'text-orange-600' : 'text-neutral-400')} />
                    <div className="text-xs font-bold">Local Merchant</div>
                    <div className="text-[10px] text-neutral-500">List my store & stock</div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="name" className="label text-xs font-bold text-neutral-800">
                  {role === 'MERCHANT' ? 'Merchant Contact Name' : 'Full Name'}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] focus:bg-white text-base text-[#0a0a0a] focus:outline-none focus:border-orange-500 transition-all font-semibold"
                  required
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>

              <div>
                <label htmlFor="identifier" className="label text-xs font-bold text-neutral-800 flex items-center justify-between">
                  <span>Mobile Number or Email</span>
                  <span className="text-[11px] font-normal text-neutral-400">Indian 10-digit or valid email</span>
                </label>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] focus:bg-white text-base text-[#0a0a0a] focus:outline-none focus:border-orange-500 transition-all font-semibold"
                  required
                  placeholder="e.g. 9876543210 or ramesh@gmail.com"
                />
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  We will send a 6-digit OTP to verify your phone/email. Secure and instant!
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-extrabold text-sm shadow-md hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Sending Verification Code...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="font-extrabold text-orange-600 hover:text-orange-700">
            Sign In with OTP
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-xs text-neutral-400 hover:text-black transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

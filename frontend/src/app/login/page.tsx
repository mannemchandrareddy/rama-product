'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';
import { ShieldCheck, Smartphone, Mail, KeyRound, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendOtp, verifyOtp } = useAuth();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState<'input' | 'verify'>('input');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpStep === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  // Auto-focus first digit on verify step
  useEffect(() => {
    if (otpStep === 'verify') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpStep]);

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your mobile number or email address');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const res = await sendOtp(identifier.trim(), 'login');
      if (res.success) {
        setOtpStep('verify');
        setCountdown(30);
        setCanResend(false);
        setSuccessMsg(res.message);
        if (res.otp) {
          setDemoOtp(res.otp);
        }
      } else {
        setError(res.message || 'Failed to send OTP. Please check the details.');
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
      // Pasting full code
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

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await verifyOtp(identifier.trim(), enteredCode, 'login');
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || '/';
      router.push(returnUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired OTP';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Sign In
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signIn(identifier.trim(), password);
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl') || '/';
      router.push(returnUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden bg-dot-pattern">
      {/* Ambient background glowing orbs */}
      <div className="apple-glow-orb apple-glow-orb-primary w-96 h-96 -top-20 -left-20" />
      <div className="apple-glow-orb apple-glow-orb-amber w-96 h-96 -bottom-20 -right-20" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] shadow-sm">
              L
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0a0a0a]">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0a0a0a] tracking-tight">
            {otpStep === 'verify' ? 'Enter Verification Code' : 'Welcome to LocalMart'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {otpStep === 'verify'
              ? `We sent a 6-digit code to ${identifier}`
              : 'Sign in to compare local stores, save on groceries, and check live stock'}
          </p>
        </div>

        {/* Card Box */}
        <div className="apple-glow-card p-6 sm:p-8 bg-white shadow-xl border-black/[0.08] rounded-3xl">
          {/* Mode Switcher Pills (OTP vs Password) */}
          {otpStep === 'input' && (
            <div className="grid grid-cols-2 p-1 mb-6 rounded-2xl bg-[#f4f4f5] border border-[#e4e4e7]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setError('');
                }}
                className={cn(
                  'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  authMode === 'otp'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instant OTP Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setError('');
                }}
                className={cn(
                  'py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                  authMode === 'password'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Password</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 animate-shake">
              {error}
            </div>
          )}

          {/* ── FLOW 1: OTP VERIFICATION STEP ── */}
          {otpStep === 'verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
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

              {/* Resend Timer & Change Identifier */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('input');
                    setError('');
                  }}
                  className="text-neutral-500 hover:text-black font-semibold cursor-pointer underline underline-offset-2"
                >
                  Edit Number/Email
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
                <span>{isLoading ? 'Verifying Code...' : 'Verify & Continue'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          ) : authMode === 'otp' ? (
            /* ── FLOW 2: ENTER MOBILE OR EMAIL FOR OTP ── */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="identifier" className="label text-xs font-bold text-neutral-800 flex items-center justify-between">
                  <span>Mobile Number or Email</span>
                  <span className="text-[11px] font-normal text-neutral-400">Indian 10-digit or valid email</span>
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 rounded-2xl bg-[#fafafc] border border-[#e4e4e7] focus:bg-white text-base text-[#0a0a0a] focus:outline-none focus:border-orange-500 transition-all font-semibold"
                    required
                    placeholder="e.g. 9876543210 or name@gmail.com"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  We will send a 6-digit one-time password (OTP) to verify your identity. No password needed!
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-tr from-[#ff5e00] to-[#ff7a29] text-white font-extrabold text-sm shadow-md hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLoading ? 'Sending OTP Code...' : 'Continue with OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ── FLOW 3: TRADITIONAL PASSWORD SIGN IN ── */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label text-xs font-bold text-neutral-800">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="label text-xs font-bold text-neutral-800">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
              >
                {isLoading ? 'Signing in...' : 'Sign In with Password'}
              </button>
            </form>
          )}
        </div>

        {/* Footer Links */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          New to LocalMart?{' '}
          <Link href="/register" className="font-extrabold text-orange-600 hover:text-orange-700">
            Create an Account with OTP
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

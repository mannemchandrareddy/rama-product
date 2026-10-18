/**
 * Authentication hook — manages Supabase Auth state and user sync.
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { api, warmupApi } from '@/lib/api';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOtp: (identifier: string, purpose?: string, name?: string, role?: UserRole) => Promise<{ success: boolean; message: string; otp?: string; identifier: string }>;
  verifyOtp: (identifier: string, otp: string, purpose?: string, name?: string, role?: UserRole) => Promise<void>;
  submitFeedback: (rating: number, tags: string[], comment?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUser = useCallback(async () => {
    try {
      const res = (await api.auth.me()) as { success: boolean; data: User };
      if (res.success && res.data) {
        setUser(res.data);
        return;
      }
    } catch {
      // User may not exist in DB yet — fall through to sync
    }

    try {
      const syncRes = (await api.auth.sync()) as { success: boolean; data: User };
      if (syncRes.success && syncRes.data) {
        setUser(syncRes.data);
      }
    } catch (err) {
      console.warn('Failed to sync user:', err instanceof Error ? err.message : err);
    }
  }, []);

  useEffect(() => {
    // Warm up the backend if sleeping on Render free tier
    warmupApi();

    // Check initial session
    const initAuth = async () => {
      try {
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (localToken) {
          await syncUser();
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await syncUser();
          }
        }
      } catch (err) {
        console.warn('Auth init warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await syncUser();
      } else if (event === 'SIGNED_OUT' && !localStorage.getItem('auth_token')) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUser]);

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    let localSuccess = false;
    try {
      const res = (await api.auth.register({ email, password, name, role })) as { success: boolean; token: string; data: User };
      if (res.success && res.token) {
        localStorage.setItem('auth_token', res.token);
        setUser(res.data);
        localSuccess = true;
      }
    } catch (err) {
      console.warn('Local register failed, attempting Supabase fallback:', err);
    }

    try {
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
    } catch (supabaseErr) {
      if (!localSuccess) throw supabaseErr;
    }

    if (!localSuccess) {
      await syncUser();
    }
  };

  const signIn = async (email: string, password: string) => {
    let localSuccess = false;
    try {
      const res = (await api.auth.login({ email, password })) as { success: boolean; token: string; data: User };
      if (res.success && res.token) {
        localStorage.setItem('auth_token', res.token);
        setUser(res.data);
        localSuccess = true;
      }
    } catch (err) {
      console.warn('Local login failed, attempting Supabase fallback:', err);
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error && !localSuccess) throw error;
    } catch (supabaseErr) {
      if (!localSuccess) throw supabaseErr;
    }

    if (!localSuccess) {
      await syncUser();
    }
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
  };

  const sendOtp = async (identifier: string, purpose?: string, name?: string, role?: UserRole) => {
    const res = (await api.auth.sendOtp({ identifier, purpose, name, role })) as {
      success: boolean;
      message: string;
      otp?: string;
      identifier: string;
    };
    return res;
  };

  const verifyOtp = async (identifier: string, otp: string, purpose?: string, name?: string, role?: UserRole) => {
    const res = (await api.auth.verifyOtp({ identifier, otp, purpose, name, role })) as {
      success: boolean;
      token: string;
      data: User;
    };
    if (res.success && res.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', res.token);
      }
      setUser(res.data);
    } else {
      throw new Error('Verification failed. Invalid or expired OTP.');
    }
  };

  const submitFeedback = async (rating: number, tags: string[], comment?: string) => {
    try {
      await api.auth.submitFeedback({
        rating,
        tags,
        comment,
        user_name: user?.name,
      });
    } catch (err) {
      console.warn('Feedback submit warning:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || null,
        signUp,
        signIn,
        signOut,
        sendOtp,
        verifyOtp,
        submitFeedback,
        refreshUser: syncUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

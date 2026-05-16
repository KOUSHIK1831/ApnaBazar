import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BACKEND_URL } from '@/lib/constants';

const CREDENTIALS_KEY = 'apnabazar_credentials';
const PHONE_EMAIL_MAP_KEY = 'apnabazar_phone_email_map';

interface StoredCredentials {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_blocked?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (phone: string, name: string, email: string, password: string, isIntern?: boolean) => Promise<{ error: Error | null }>;
  signIn: {
    sendOtp: (phone: string) => Promise<void>;
    verifyOtp: (phone: string, otp: string) => Promise<{ error: Error | null }>;
    password: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  };
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storeCredentials(email: string, password: string) {
  try {
    sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ email, password }));
  } catch {
    // sessionStorage unavailable
  }
}

function getStoredCredentials(): StoredCredentials | null {
  try {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredCredentials() {
  try {
    sessionStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

function storePhoneEmail(phone: string, email: string) {
  try {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return;
    const raw = localStorage.getItem(PHONE_EMAIL_MAP_KEY);
    const map = raw ? JSON.parse(raw) as Record<string, string> : {};
    map[digits] = email;
    localStorage.setItem(PHONE_EMAIL_MAP_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable
  }
}

function getEmailForPhone(phone: string) {
  try {
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    const raw = localStorage.getItem(PHONE_EMAIL_MAP_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[digits] || null;
  } catch {
    return null;
  }
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return phone;
  return digits.startsWith('91') && digits.length === 12 ? `+${digits}` : `+91${digits}`;
}

async function readResponseBody(res: Response) {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  const text = await res.text().catch(() => '');
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getAuthErrorMessage(body: unknown, fallback: string) {
  if (typeof body === 'string') {
    return body.trim() || fallback;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const message = record.message || record.detail || record.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function normalizePasswordLoginError(error: Error) {
  const msg = error.message || 'Login failed';
  if (/invalid login credentials/i.test(msg)) {
    return new Error('Invalid email or password. If this is your first login for this email, create the account once from Create Account, then sign in.');
  }
  return error;
}

async function ensureSupabaseSession(email: string, password: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.email === email) return;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn('[Auth] Supabase re-auth failed:', error.message);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        // Load profile role and block status from `profiles` table
        let role = meta.role || 'seller';
        let is_blocked = false;
        try {
          const { data: profile } = await supabase.from('profiles').select('role, is_blocked').eq('id', session.user.id).single();
          if (profile && typeof profile === 'object' && 'role' in profile && profile.role) {
            role = profile.role as string;
            is_blocked = !!(profile as { is_blocked?: boolean }).is_blocked;
          }
        } catch (e) {
          // ignore — fall back to metadata
        }

        if (is_blocked) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: meta.name || '',
            phone: meta.phone || meta.phone_number || '',
            role,
            is_blocked,
          });
        }
      }
      setLoading(false);
    };
    restore();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        (async () => {
          let role = meta.role || 'seller';
          let is_blocked = false;
          try {
            const { data: profile } = await supabase.from('profiles').select('role, is_blocked').eq('id', session.user.id).single();
            if (profile && typeof profile === 'object' && 'role' in profile && profile.role) {
              role = profile.role as string;
              is_blocked = !!(profile as { is_blocked?: boolean }).is_blocked;
            }
          } catch (e) {
            // ignore
          }

          if (is_blocked) {
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: meta.name || '',
              phone: meta.phone || meta.phone_number || '',
              role,
              is_blocked,
            });
          }
        })();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (phone: string, name: string, email: string, password: string, isBuyer = false) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: normalizePhone(phone),
            role: isBuyer ? 'buyer' : 'seller',
          },
        },
      });

      if (error) {
        return { error };
      }

      storePhoneEmail(phone, email);
      storeCredentials(email, password);

      if (!data.session) {
        await ensureSupabaseSession(email, password);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error') };
    }
  };

  const sendOtp = async (phone: string) => {
    const res = await fetch(`${BACKEND_URL}/auth/login/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizePhone(phone) }),
    });
    if (!res.ok) {
      const body = await readResponseBody(res);
      throw new Error(getAuthErrorMessage(body, 'Failed to send OTP'));
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), otp_code: otp }),
      });
      const data = await readResponseBody(res);
      const response = data && typeof data === 'object' ? data as Record<string, unknown> : null;
      if (res.ok && typeof response?.access_token === 'string') {
        const digits = phone.replace(/\D/g, '');
        const email = getEmailForPhone(digits) || `${digits}@apnabazar.app`;
        const password = `apna_${digits}_bazar`; // Deterministic password for OTP-only users

        // Try login
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (signInError) {
          // If login fails, try signing up (they might be a new buyer)
          const { error: signUpError } = await signUp(phone, `Buyer ${digits.slice(-4)}`, email, password, true);
          if (signUpError) {
            console.error('[Auth] Buyer auto-signup failed:', signUpError.message);
          }
        } else {
          storeCredentials(email, password);
          storePhoneEmail(phone, email);
        }
        
        return { error: null };
      }
      return { error: new Error(getAuthErrorMessage(data, 'OTP verification failed')) };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error') };
    }
  };

  const passwordLogin = async (identifier: string, password: string) => {
    try {
      const email = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : getEmailForPhone(identifier) || `${identifier.replace(/\D/g, '')}@apnabazar.app`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        storeCredentials(email, password);
        return { error: null };
      }
      return { error: normalizePasswordLoginError(error) };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Network error') };
    }
  };

  const signOut = async () => {
    clearStoredCredentials();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn: { sendOtp, verifyOtp, password: passwordLogin },
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

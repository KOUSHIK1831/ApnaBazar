import { useState, useEffect, useReducer, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, ShoppingBag, Shield, Loader2, Eye, EyeOff, Phone, Mail, LogIn, UserPlus, RefreshCw, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

type Mode = 'login' | 'signup';
type LoginMethod = 'otp' | 'password';

interface AuthState {
  mode: Mode;
  loginMethod: LoginMethod;
  showPassword: {
    login: boolean;
    signup: boolean;
  };
  submitting: boolean;
  resendTimer: number;
  canResend: boolean;
  showOtpInput: boolean;
  form: {
    phone: string;
    loginEmail: string;
    loginPassword: string;
    otp: string;
    signupName: string;
    signupEmail: string;
    signupPassword: string;
    signupRole: 'seller' | 'buyer';
  };
}

type AuthAction = 
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SET_LOGIN_METHOD'; payload: LoginMethod }
  | { type: 'TOGGLE_PASSWORD'; payload: 'login' | 'signup' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_RESEND_TIMER'; payload: number }
  | { type: 'SET_CAN_RESEND'; payload: boolean }
  | { type: 'SET_SHOW_OTP'; payload: boolean }
  | { type: 'UPDATE_FORM'; payload: Partial<AuthState['form']> }
  | { type: 'RESET_FORM' };

const initialState: AuthState = {
  mode: 'login',
  loginMethod: 'password',
  showPassword: { login: false, signup: false },
  submitting: false,
  resendTimer: 0,
  canResend: false,
  showOtpInput: false,
  form: {
    phone: '',
    loginEmail: '',
    loginPassword: '',
    otp: '',
    signupName: '',
    signupEmail: '',
    signupPassword: '',
    signupRole: 'seller',
  }
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_MODE': return { ...state, mode: action.payload };
    case 'SET_LOGIN_METHOD': return { ...state, loginMethod: action.payload };
    case 'TOGGLE_PASSWORD': return { 
      ...state, 
      showPassword: { ...state.showPassword, [action.payload]: !state.showPassword[action.payload] } 
    };
    case 'SET_SUBMITTING': return { ...state, submitting: action.payload };
    case 'SET_RESEND_TIMER': return { ...state, resendTimer: action.payload };
    case 'SET_CAN_RESEND': return { ...state, canResend: action.payload };
    case 'SET_SHOW_OTP': return { ...state, showOtpInput: action.payload };
    case 'UPDATE_FORM': return { ...state, form: { ...state.form, ...action.payload } };
    case 'RESET_FORM': return { ...initialState, mode: state.mode, loginMethod: state.loginMethod };
    default: return state;
  }
}

export default function Auth() {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { mode, loginMethod, showPassword, submitting, resendTimer, canResend, showOtpInput, form } = state;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        if (resendTimer <= 1) {
          dispatch({ type: 'SET_CAN_RESEND', payload: true });
          dispatch({ type: 'SET_RESEND_TIMER', payload: 0 });
        } else {
          dispatch({ type: 'SET_RESEND_TIMER', payload: resendTimer - 1 });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'seller') navigate('/dashboard');
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'buyer') navigate('/buyer');
    }
  }, [user, loading, navigate]);

  const isValidPhone = useCallback(() => form.phone.length === 10 && parseInt(form.phone[0]) > 5, [form.phone]);

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await signIn.sendOtp(form.phone);
      dispatch({ type: 'SET_SHOW_OTP', payload: true });
      dispatch({ type: 'SET_RESEND_TIMER', payload: 60 });
      dispatch({ type: 'SET_CAN_RESEND', payload: false });
      toast({ title: 'OTP Sent', description: 'Check your phone for the OTP' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to send OTP', variant: 'destructive' });
    }
    dispatch({ type: 'SET_SUBMITTING', payload: false });
  };

  const handleVerifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    const { error } = await signIn.verifyOtp(form.phone, form.otp);
    dispatch({ type: 'SET_SUBMITTING', payload: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully' });
      // Navigate directly based on profile role
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        const role = profile?.role || session.user.user_metadata?.role || 'seller';
        if (role === 'buyer') navigate('/buyer');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      }
    }
  };

  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.loginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.loginEmail) || !form.loginPassword) {
      toast({ title: 'Error', description: 'Please enter a valid email and password', variant: 'destructive' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    const { error } = await signIn.password(form.loginEmail, form.loginPassword);
    dispatch({ type: 'SET_SUBMITTING', payload: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully' });
      // Read role directly from profile to navigate immediately
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        const role = profile?.role || session.user.user_metadata?.role || 'seller';
        if (role === 'buyer') navigate('/buyer');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
      }
    }
  };

  const handleCreateAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidPhone()) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    if (!form.signupName.trim() || !form.signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.signupEmail) || !form.signupPassword || form.signupPassword.length < 6) {
      toast({ title: 'Error', description: 'Please check your information', variant: 'destructive' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      const { error } = await signUp(form.phone, form.signupName, form.signupEmail, form.signupPassword, form.signupRole === 'buyer');
      if (error) throw error;
      const { error: loginErr } = await signIn.password(form.signupEmail, form.signupPassword);
      if (loginErr) {
        toast({ title: 'Account Created', description: 'Account created! Please sign in with your credentials.' });
        dispatch({ type: 'SET_MODE', payload: 'login' });
        dispatch({ type: 'UPDATE_FORM', payload: { loginEmail: form.signupEmail, loginPassword: '' } });
      } else {
        toast({ title: 'Account Created', description: 'Welcome to ApnaBazar!' });
        // Navigate directly based on chosen role — no need to wait for useEffect
        if (form.signupRole === 'buyer') navigate('/buyer');
        else navigate('/dashboard');
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create account', variant: 'destructive' });
    }
    dispatch({ type: 'SET_SUBMITTING', payload: false });
  };

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <NetworkStrengthIndicator />
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <AuthHeader t={t} />
        <Card>
          <AuthModeToggle mode={mode} dispatch={dispatch} t={t} />
          <CardContent>
            {mode === 'login' ? (
              <LoginForm key="login"
                state={state} 
                dispatch={dispatch} 
                handlers={{ handleSendOtp, handleVerifyOtp, handlePasswordLogin, formatPhone, isValidPhone }} 
                t={t} 
              />
            ) : (
              <SignupForm key="signup"
                state={state} 
                dispatch={dispatch} 
                handlers={{ handleCreateAccount, formatPhone }} 
                t={t} 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuthHeader({ t }: { t: any }) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto size-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4">
        <Store className="size-6 text-white" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('common.appName')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t('auth.joinUs')}</p>
    </div>
  );
}

function AuthModeToggle({ mode, dispatch, t }: { mode: Mode, dispatch: React.Dispatch<AuthAction>, t: any }) {
  return (
    <CardHeader className="pb-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { dispatch({ type: 'SET_MODE', payload: 'login' }); dispatch({ type: 'RESET_FORM' }); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            mode === 'login' ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <LogIn className="size-4" /> {t('auth.signIn')}
        </button>
        <button
          onClick={() => { dispatch({ type: 'SET_MODE', payload: 'signup' }); dispatch({ type: 'RESET_FORM' }); }}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
            mode === 'signup' ? 'border-primary bg-primary/5 text-primary' : 'border-border/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserPlus className="size-4" /> {t('auth.signUp')}
        </button>
      </div>
      <CardTitle className="text-lg">{mode === 'login' ? t('auth.signIn') : t('auth.signUp')}</CardTitle>
      <CardDescription>{mode === 'login' ? t('auth.welcomeBack') : t('auth.joinUs')}</CardDescription>
    </CardHeader>
  );
}

function LoginForm({ state, dispatch, handlers, t }: { state: AuthState, dispatch: React.Dispatch<AuthAction>, handlers: any, t: any }) {
  const { loginMethod, showOtpInput, showPassword, submitting, resendTimer, canResend, form } = state;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (loginMethod === 'password') handlers.handlePasswordLogin(); else if (showOtpInput) handlers.handleVerifyOtp(); else handlers.handleSendOtp(); }} className="space-y-4">
      {loginMethod === 'otp' && !showOtpInput && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Phone className="size-4" /> Enter your registered phone number
          </p>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">+91</div>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="Enter 10-digit phone"
              value={form.phone}
              onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { phone: handlers.formatPhone(e.target.value) } })}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Prefer password?{' '}
            <button type="button" onClick={() => dispatch({ type: 'SET_LOGIN_METHOD', payload: 'password' })} className="text-primary hover:underline font-medium">Login with password</button>
          </p>
          <Button type="submit" disabled={submitting || !handlers.isValidPhone()} className="w-full">
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />} Send OTP
          </Button>
        </div>
      )}

      {loginMethod === 'otp' && showOtpInput && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <MessageSquare className="size-4" /> OTP sent to +91 {form.phone}
          </p>
          <Input
            type="text"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit OTP"
            value={form.otp}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { otp: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
          <Button type="submit" disabled={submitting || form.otp.length !== 6} className="w-full">
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />} Verify OTP
          </Button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { dispatch({ type: 'SET_CAN_RESEND', payload: false }); dispatch({ type: 'UPDATE_FORM', payload: { otp: '' } }); handlers.handleSendOtp(); }}
              disabled={!canResend || submitting}
              className="flex items-center gap-1 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              <RefreshCw className="size-3" /> {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
            <button type="button" onClick={() => dispatch({ type: 'SET_SHOW_OTP', payload: false })} className="text-sm text-muted-foreground hover:underline">Back</button>
          </div>
        </div>
      )}

      {loginMethod === 'password' && (
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={form.loginEmail}
              onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { loginEmail: e.target.value } })}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Input
              type={showPassword.login ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.loginPassword}
              onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { loginPassword: e.target.value } })}
              className="pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlers.handlePasswordLogin();
                }
              }}
            />
            <button type="button" onClick={() => dispatch({ type: 'TOGGLE_PASSWORD', payload: 'login' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword.login ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Prefer OTP?{' '}
            <button type="button" onClick={() => dispatch({ type: 'SET_LOGIN_METHOD', payload: 'otp' })} className="text-primary hover:underline font-medium">Login with OTP</button>
          </p>
          <Button type="submit" disabled={submitting || !form.loginEmail.trim() || !form.loginPassword} className="w-full">
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />} {t('auth.signIn')}
          </Button>
        </div>
      )}

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <button type="button" onClick={() => { dispatch({ type: 'SET_MODE', payload: 'signup' }); dispatch({ type: 'RESET_FORM' }); }} className="text-primary hover:underline font-medium">{t('auth.signUp')}</button>
      </p>
    </form>
  );
}


function SignupForm({ state, dispatch, handlers, t }: { state: AuthState, dispatch: React.Dispatch<AuthAction>, handlers: any, t: any }) {
  const { showPassword, submitting, form } = state;

  return (
    <form onSubmit={handlers.handleCreateAccount} className="space-y-4">
      <div className="space-y-3 mb-6 p-1 bg-muted/30 rounded-2xl border border-border/50">
        <div className="grid grid-cols-2 gap-1">
          <SignupRoleButton role="seller" currentRole={form.signupRole} dispatch={dispatch} />
          <SignupRoleButton role="buyer" currentRole={form.signupRole} dispatch={dispatch} />
        </div>
        <div className="px-3 pb-2 text-center">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
            <Shield className="size-3 text-primary/70" /> Role is permanent and cannot be changed later
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">+91</div>
        <Input
          type="tel"
          autoComplete="tel"
          placeholder="Enter 10-digit phone"
          value={form.phone}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { phone: handlers.formatPhone(e.target.value) } })}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          autoComplete="name"
          placeholder="Full Name"
          value={form.signupName}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { signupName: e.target.value } })}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          value={form.signupEmail}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { signupEmail: e.target.value } })}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Input
          type={showPassword.signup ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Create Password (min 6 chars)"
          value={form.signupPassword}
          onChange={(e) => dispatch({ type: 'UPDATE_FORM', payload: { signupPassword: e.target.value } })}
          className="pr-10"
        />
        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_PASSWORD', payload: 'signup' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {showPassword.signup ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting && <Loader2 className="size-4 mr-2 animate-spin" />} {t('auth.signUp')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.hasAccount')}{' '}
        <button type="button" onClick={() => { dispatch({ type: 'SET_MODE', payload: 'login' }); dispatch({ type: 'RESET_FORM' }); }} className="text-primary hover:underline font-medium">{t('auth.signIn')}</button>
      </p>
    </form>
  );
}

function SignupRoleButton({ role, currentRole, dispatch }: { role: 'seller' | 'buyer', currentRole: string, dispatch: React.Dispatch<AuthAction> }) {
  const isSelected = currentRole === role;
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'UPDATE_FORM', payload: { signupRole: role } })}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${ isSelected ? 'bg-card text-primary shadow-md scale-100 ring-2 ring-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground scale-[0.98]' }`}
    >
      <div className={`size-10 rounded-full flex items-center justify-center mb-1 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
        {role === 'seller' ? <Store className="size-5" /> : <ShoppingBag className="size-5" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold leading-none mb-1">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
        <p className="text-[10px] opacity-70 leading-tight">{role === 'seller' ? 'Create your digital store' : 'Browse & buy products'}</p>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 size-4 bg-primary text-white rounded-full flex items-center justify-center">
          <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}


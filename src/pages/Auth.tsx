import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, ShoppingBag, Shield, Loader2, Eye, EyeOff, Phone, User, Mail, LogIn, UserPlus, RefreshCw, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

type Mode = 'login' | 'signup';
type LoginMethod = 'otp' | 'password';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'seller' | 'buyer'>('seller');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'seller') navigate('/dashboard');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [user, loading, navigate]);

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  const isValidPhone = () => phoneDigits.length === 10 && parseInt(phoneDigits[0]) > 5;

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await signIn.sendOtp(phoneDigits);
      setShowOtpInput(true);
      setResendTimer(60);
      setCanResend(false);
      toast({ title: 'OTP Sent', description: 'Check your phone for the OTP' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to send OTP', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter a valid 6-digit OTP', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await signIn.verifyOtp(phoneDigits, otp);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully' });
      // Redirection handled by useEffect
    }
  };

  const handlePasswordLogin = async () => {
    if (!loginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail) || !password) {
      toast({ title: 'Error', description: 'Please enter a valid email and password', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await signIn.password(loginEmail, password);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Logged in successfully' });
      // Redirection handled by useEffect
    }
  };

  const handleCreateAccount = async () => {
    if (!isValidPhone()) {
      toast({ title: 'Error', description: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    if (!signupName.trim()) {
      toast({ title: 'Error', description: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (!signupEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signUp(phoneDigits, signupName, signupEmail, signupPassword, signupRole === 'buyer');
      if (error) {
        throw error;
      }
      toast({ title: 'Account Created', description: 'Welcome to ApnaBazar!' });
      navigate(signupRole === 'buyer' ? '/' : '/dashboard');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create account', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setCanResend(false);
    setOtp('');
    await handleSendOtp();
  };

  const resetForm = () => {
    setPhoneDigits('');
    setLoginEmail('');
    setPassword('');
    setOtp('');
    setShowOtpInput(false);
    setResendTimer(0);
    setCanResend(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <NetworkStrengthIndicator />
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('common.appName')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.joinUs')}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="w-4 h-4" /> {t('auth.signIn')}
              </button>
              <button
                onClick={() => { setMode('signup'); resetForm(); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="w-4 h-4" /> {t('auth.signUp')}
              </button>
            </div>
            <CardTitle className="text-lg">{mode === 'login' ? t('auth.signIn') : t('auth.signUp')}</CardTitle>
            <CardDescription>
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.joinUs')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <>
                {loginMethod === 'otp' && !showOtpInput && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Enter your registered phone number
                    </p>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="Enter 10-digit phone"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(formatPhone(e.target.value))}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prefer password?{' '}
                      <button onClick={() => setLoginMethod('password')} className="text-primary hover:underline font-medium">
                        Login with password
                      </button>
                    </p>
                    <Button onClick={handleSendOtp} disabled={submitting || !isValidPhone()} className="w-full">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Send OTP
                    </Button>
                  </div>
                )}

                {loginMethod === 'otp' && showOtpInput && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> OTP sent to +91 {phoneDigits}
                    </p>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                    />
                    <Button onClick={handleVerifyOtp} disabled={submitting || otp.length !== 6} className="w-full">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Verify OTP
                    </Button>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleResendOtp}
                        disabled={!canResend || submitting}
                        className="flex items-center gap-1 text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </button>
                      <button
                        onClick={() => { setShowOtpInput(false); setOtp(''); setResendTimer(0); setCanResend(false); }}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {loginMethod === 'password' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordLogin(); }}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Prefer OTP?{' '}
                      <button onClick={() => setLoginMethod('otp')} className="text-primary hover:underline font-medium">
                        Login with OTP
                      </button>
                    </p>
                    <Button onClick={handlePasswordLogin} disabled={submitting || !loginEmail.trim() || !password} className="w-full">
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {t('auth.signIn')}
                    </Button>
                  </div>
                )}

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {t('auth.noAccount')}{' '}
                  <button onClick={() => { setMode('signup'); resetForm(); }} className="text-primary hover:underline font-medium">
                    {t('auth.signUp')}
                  </button>
                </p>
              </>
            )}

            {/* SIGNUP MODE */}
            {mode === 'signup' && (
              <div className="space-y-4">
                <div className="space-y-3 mb-6 p-1 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setSignupRole('seller')}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                        signupRole === 'seller' 
                          ? 'bg-card text-primary shadow-md scale-100 ring-2 ring-primary' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground scale-[0.98]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${signupRole === 'seller' ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold leading-none mb-1">Seller</p>
                        <p className="text-[10px] opacity-70 leading-tight">Create your digital store</p>
                      </div>
                      {signupRole === 'seller' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => setSignupRole('buyer')}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                        signupRole === 'buyer' 
                          ? 'bg-card text-primary shadow-md scale-100 ring-2 ring-primary' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground scale-[0.98]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${signupRole === 'buyer' ? 'bg-primary/10' : 'bg-muted'}`}>
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold leading-none mb-1">Buyer</p>
                        <p className="text-[10px] opacity-70 leading-tight">Browse & buy products</p>
                      </div>
                      {signupRole === 'buyer' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="px-3 pb-2 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
                      <Shield className="w-3 h-3 text-primary/70" />
                      Role is permanent and cannot be changed later
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    +91
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone"
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(formatPhone(e.target.value))}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Input
                    type={showSignupPassword ? 'text' : 'password'}
                    placeholder="Create Password (min 6 chars)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button onClick={handleCreateAccount} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Account
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.hasAccount')}{' '}
                  <button onClick={() => { setMode('login'); resetForm(); }} className="text-primary hover:underline font-medium">
                    {t('auth.signIn')}
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

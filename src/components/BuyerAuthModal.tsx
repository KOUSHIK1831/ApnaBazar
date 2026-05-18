import { useReducer, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Store, Phone, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone?: string) => void;
  storeName?: string;
}

interface BuyerAuthState {
  phoneDigits: string;
  showOtpInput: boolean;
  otp: string;
  showPassword: boolean;
  submitting: boolean;
  error: string;
}

type BuyerAuthAction = 
  | { type: 'SET_PHONE'; payload: string }
  | { type: 'SET_SHOW_OTP'; payload: boolean }
  | { type: 'SET_OTP'; payload: string }
  | { type: 'TOGGLE_PASSWORD' }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: BuyerAuthState = {
  phoneDigits: '',
  showOtpInput: false,
  otp: '',
  showPassword: false,
  submitting: false,
  error: '',
};

function authReducer(state: BuyerAuthState, action: BuyerAuthAction): BuyerAuthState {
  switch (action.type) {
    case 'SET_PHONE': return { ...state, phoneDigits: action.payload };
    case 'SET_SHOW_OTP': return { ...state, showOtpInput: action.payload };
    case 'SET_OTP': return { ...state, otp: action.payload };
    case 'TOGGLE_PASSWORD': return { ...state, showPassword: !state.showPassword };
    case 'SET_SUBMITTING': return { ...state, submitting: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'RESET': return initialState;
    default: return state;
  }
}

export default function BuyerAuthModal({ isOpen, onClose, onSuccess, storeName }: BuyerAuthModalProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { signIn } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);
  const isValidPhone = () => state.phoneDigits.length === 10 && parseInt(state.phoneDigits[0]) > 5;

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid 10-digit phone number' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });
    try {
      await signIn.sendOtp(state.phoneDigits);
      dispatch({ type: 'SET_SHOW_OTP', payload: true });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to send OTP' });
    }
    dispatch({ type: 'SET_SUBMITTING', payload: false });
  };

  const handleVerifyOtp = async () => {
    if (!state.otp || state.otp.length !== 6) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid 6-digit OTP' });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });
    const { error: authError } = await signIn.verifyOtp(state.phoneDigits, state.otp);
    dispatch({ type: 'SET_SUBMITTING', payload: false });
    if (authError) {
      dispatch({ type: 'SET_ERROR', payload: authError.message });
    } else {
      onSuccess(state.phoneDigits);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default w-full h-full border-none p-0" onClick={onClose} aria-label="Close authentication" />
      <div className="relative w-full max-w-sm mx-4 bg-card rounded-2xl shadow-2xl border border-border/50 animate-slide-up overflow-hidden">
        <div className="bg-gradient-brand px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"><X className="size-5" /></button>
          <div className="flex items-center gap-2 mb-2"><Store className="size-5" /><span className="text-sm font-medium opacity-80">{storeName || t('common.appName')}</span></div>
          <h2 className="text-lg font-semibold">{t('buyerAuth.title')}</h2>
          <p className="text-sm opacity-80 mt-1">{t('buyerAuth.desc')}</p>
        </div>
        <div className="p-6">
          {state.error && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">{state.error}</div>}
          {!state.showOtpInput ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="size-4" /> Enter your phone number to continue</p>
              <div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">+91</div><Input type="tel" placeholder="Enter 10-digit phone" value={state.phoneDigits} onChange={(e) => dispatch({ type: 'SET_PHONE', payload: formatPhone(e.target.value) })} className="pl-10" /></div>
              <Button onClick={handleSendOtp} disabled={state.submitting} className="w-full">{state.submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}Send OTP</Button>

            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2"><MessageSquare className="size-4" /> OTP sent to +91 {state.phoneDigits}</p>
              <div className="relative"><Input type={state.showPassword ? 'text' : 'text'} placeholder="Enter 6-digit OTP" value={state.otp} onChange={(e) => dispatch({ type: 'SET_OTP', payload: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="text-center text-2xl tracking-widest pr-10" maxLength={6} /><button type="button" onClick={() => dispatch({ type: 'TOGGLE_PASSWORD' })} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground" aria-label={state.showPassword ? 'Hide password' : 'Show password'}>{state.showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
              <Button onClick={handleVerifyOtp} disabled={state.submitting || state.otp.length !== 6} className="w-full">{state.submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}Verify & Place Order</Button>
              <div className="flex items-center justify-between"><button onClick={handleSendOtp} className="text-sm text-primary hover:underline">Resend OTP</button><button onClick={() => dispatch({ type: 'RESET' })} className="text-sm text-muted-foreground hover:underline">Change number</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

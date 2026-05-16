import { useState } from 'react';
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

export default function BuyerAuthModal({ isOpen, onClose, onSuccess, storeName }: BuyerAuthModalProps) {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);
  const isValidPhone = () => phoneDigits.length === 10 && parseInt(phoneDigits[0]) > 5;

  const handleSendOtp = async () => {
    if (!isValidPhone()) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await signIn.sendOtp(phoneDigits);
      setShowOtpInput(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    }
    setSubmitting(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: authError } = await signIn.verifyOtp(phoneDigits, otp);
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
    } else {
      onSuccess(phoneDigits);
    }
  };

  const resetForm = () => {
    setPhoneDigits('');
    setOtp('');
    setShowOtpInput(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-card rounded-2xl shadow-2xl border border-border/50 animate-slide-up overflow-hidden">
        <div className="bg-gradient-brand px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium opacity-80">{storeName || t('common.appName')}</span>
          </div>
          <h2 className="text-lg font-bold">
            {t('buyerAuth.title')}
          </h2>
          <p className="text-sm opacity-80 mt-1">
            {t('buyerAuth.desc')}
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {!showOtpInput ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4" /> Enter your phone number to continue
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
              <Button
                onClick={handleSendOtp}
                disabled={submitting || !isValidPhone()}
                className="w-full"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send OTP
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> OTP sent to +91 {phoneDigits}
              </p>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'text'}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={submitting || otp.length !== 6}
                className="w-full"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify & Place Order
              </Button>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSendOtp}
                  className="text-sm text-primary hover:underline"
                >
                  Resend OTP
                </button>
                <button
                  onClick={resetForm}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Change number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

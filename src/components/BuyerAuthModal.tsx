import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Loader2, Store } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface BuyerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeName?: string;
}

export default function BuyerAuthModal({ isOpen, onClose, onSuccess, storeName }: BuyerAuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { error: authError } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (authError) {
      setError(authError.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-card rounded-2xl shadow-2xl border border-border/50 animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-brand px-6 py-5 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-5 h-5" />
            <span className="text-sm font-medium opacity-80">{storeName || t('common.appName')}</span>
          </div>
          <h2 className="text-lg font-bold">
            {isLogin ? t('buyerAuth.title') : t('auth.signUp')}
          </h2>
          <p className="text-sm opacity-80 mt-1">
            {t('buyerAuth.desc')}
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90 transition-opacity" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.loading')}</>
              ) : (
                isLogin ? t('auth.signIn') : t('auth.signUp')
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

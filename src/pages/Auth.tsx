import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (isLogin) {
      navigate('/dashboard');
    } else {
      toast({ title: 'Account created', description: 'Check your email to confirm, or sign in now.' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4 animate-pulse-glow">
            <Store className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('common.appName')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.joinUs')}</p>
        </div>

        <Card className="shadow-surface-lg border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isLogin ? t('auth.signIn') : t('auth.signUp')}</CardTitle>
            <CardDescription>
              {isLogin ? t('auth.welcomeBack') : t('auth.joinUs')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Store, Upload, Sparkles, Shield, Globe } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">ApnaBazar</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="border-border/50">
              {t('auth.signIn')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="max-w-2xl animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-6 animate-pulse-glow">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Seller Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-6">
              {t('landing.hero.title')} <br className="hidden md:block" />
              <span className="text-gradient">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate('/auth')} className="bg-gradient-brand hover:opacity-90 transition-opacity text-base px-8">
                {t('landing.hero.cta')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">{t('landing.features.title')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">From uploading photos to a live storefront — we handle the heavy lifting with AI</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                title: t('landing.features.upload.title'),
                description: t('landing.features.upload.desc'),
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                icon: Zap,
                title: t('landing.features.ai.title'),
                description: t('landing.features.ai.desc'),
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Globe,
                title: t('landing.features.store.title'),
                description: t('landing.features.store.desc'),
                color: 'text-green-500',
                bg: 'bg-green-500/10',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl border border-border/50 bg-card hover:shadow-surface-lg hover:border-border transition-all duration-300"
              >
                <div className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            {[
              { icon: Shield, label: 'Secure & Private' },
              { icon: Zap, label: 'Setup in 2 Minutes' },
              { icon: Globe, label: 'Share Anywhere' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-muted-foreground">
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-brand rounded-md flex items-center justify-center">
              <Store className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t('common.appName')}</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 {t('common.appName')}. {t('landing.footer')}</p>
        </div>
      </footer>
    </div>
  );
}

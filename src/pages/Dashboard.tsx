import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSeller } from '@/hooks/useSeller';
import UploadZone from '@/components/UploadZone';
import ProductCard from '@/components/ProductCard';
import StoreSetup from '@/components/StoreSetup';
import StoreSettings from '@/components/StoreSettings';
import Orders from '@/components/Orders';
import { Button } from '@/components/ui/button';
import { LogOut, ExternalLink, Package, Upload, Store, Settings, LayoutGrid, Copy, Check, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

type Tab = 'products' | 'orders' | 'upload' | 'settings';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    seller,
    products,
    orders,
    loading,
    fetchProducts,
    createSeller,
    updateSellerProfile,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
  } = useSeller();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [copied, setCopied] = useState(false);

  const copyStoreLink = () => {
    if (seller?.store_slug) {
      navigator.clipboard.writeText(`${window.location.origin}/store/${seller.store_slug}`);
      setCopied(true);
      toast({ title: t('dashboard.copied'), description: t('settings.shareLink') });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!seller?.store_name) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">ApnaBazar</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />{t('common.signOut')}
              </Button>
            </div>
          </div>
          <StoreSetup
            onComplete={async (data) => {
              const result = await createSeller(data);
              if (result?.error) {
                toast({
                  title: 'Error creating store',
                  description: String(result.error.message || result.error),
                  variant: 'destructive',
                });
              }
            }}
          />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'products', label: t('dashboard.tabs.products'), icon: LayoutGrid },
    { id: 'orders', label: t('dashboard.tabs.orders'), icon: ShoppingBag },
    { id: 'upload', label: t('dashboard.tabs.upload'), icon: Upload },
    { id: 'settings', label: t('dashboard.tabs.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">ApnaBazar</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">{seller.store_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:block mr-2">
              <LanguageSwitcher variant="compact" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyStoreLink}
              className="border-border/50 text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? t('dashboard.copied') : t('dashboard.copyLink')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/store/${seller.store_slug}`)}
              className="border-border/50 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />{t('dashboard.viewStore')}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} title={t('common.signOut')}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <div className="border border-border/50 rounded-xl p-5 bg-card shadow-surface hover:shadow-surface-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{products.length}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.totalProducts')}</p>
              </div>
            </div>
          </div>
          <div className="border border-border/50 rounded-xl p-5 bg-card shadow-surface hover:shadow-surface-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums text-foreground">{products.length > 0 ? t('dashboard.active') : t('dashboard.ready')}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.aiAgent')}</p>
              </div>
            </div>
          </div>
          <div className="border border-border/50 rounded-xl p-5 bg-card shadow-surface hover:shadow-surface-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground truncate max-w-[140px]">/store/{seller.store_slug}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.storeUrl')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-surface'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'orders' && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'products' && (
            <div>
              {products.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">{t('dashboard.catalog')} ({products.length})</h2>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('upload')} className="border-border/50">
                      <Upload className="w-3.5 h-3.5 mr-1.5" />{t('dashboard.addProducts')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        editable
                        onUpdate={updateProduct}
                        onDelete={deleteProduct}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-border/50 rounded-xl p-16 text-center">
                  <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">{t('dashboard.noProducts')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{t('dashboard.noProductsDesc')}</p>
                  <Button onClick={() => setActiveTab('upload')} className="bg-gradient-brand hover:opacity-90 transition-opacity">
                    <Upload className="w-4 h-4 mr-2" />{t('dashboard.uploadProducts')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <Orders 
              orders={orders} 
              onUpdateStatus={updateOrderStatus} 
            />
          )}

          {activeTab === 'upload' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.uploadDigitize')}</h2>
              <UploadZone sellerId={seller.id} onComplete={fetchProducts} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{t('dashboard.tabs.settings')}</h2>
              <StoreSettings seller={seller} onUpdate={updateSellerProfile} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

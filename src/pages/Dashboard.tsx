import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSeller } from '@/hooks/useSeller';
import UploadZone from '@/components/UploadZone';
import ProductCard from '@/components/ProductCard';
import StoreSetup from '@/components/StoreSetup';
import StoreSettings from '@/components/StoreSettings';
import Orders from '@/components/Orders';
import InventoryEditor from '@/components/InventoryEditor';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  ExternalLink, 
  Package, 
  Upload, 
  Store, 
  Settings, 
  LayoutGrid, 
  Copy, 
  Check, 
  ShoppingBag, 
  ClipboardList, 
  HelpCircle,
  MessageSquarePlus
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import OfflineBanner from '@/components/OfflineBanner';
import AppTour from '@/components/AppTour';
import FeedbackModal from '@/components/FeedbackModal';
import { useWelcomeTour } from '@/hooks/useWelcomeTour';

export type Tab = 'products' | 'orders' | 'upload' | 'inventory' | 'settings';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    seller,
    products,
    orders,
    orders,
    loading,
    fetchProducts,
    fetchOrders,
    createSeller,
    updateSellerProfile,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    updateOrderStatus,
  } = useSeller();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [copied, setCopied] = useState(false);
  const { startTour } = useWelcomeTour(setActiveTab);

  useEffect(() => {
    if (!seller?.id) return;

    fetchProducts();
    
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${seller.id}`,
        },
        (payload) => {
          const newOrder = payload.new as { product_id?: string; buyer_name?: string };
          toast({
            title: t('orders.newOrder'),
            description: t('orders.newOrderDesc'),
          });
          fetchOrders();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [seller?.id, toast, t, fetchProducts, fetchOrders]);
  // Redirect admin users away from seller dashboard to the admin portal
  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin');
  }, [user?.role, navigate]);

  useEffect(() => {
    const lowStock = products.filter(
      (p) => p.stock !== undefined && p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)
    );
    if (lowStock.length > 0 && seller?.store_name) {
      toast({
        title: "Low Stock Alert",
        description: `${lowStock.length} product(s) running low on stock.`,
      });
    }
  }, [products, seller?.store_name, toast]);

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
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">ApnaBazar</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <ThemeToggle />
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <LanguageSwitcher />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />{t('common.signOut')}
              </Button>
            </div>
          </div>
          <StoreSetup
            onComplete={async (data) => {
              try {
                const result = await createSeller(data);
                if (result?.error) {
                  const err = result.error;
                  const message: string = (err as Error)?.message || String(err);
                  // Detect common DB policy/trigger recursion error and provide guidance
                  const isPolicyRecursion = /infinite recursion/i.test(message) || 
                    (typeof err === 'object' && err !== null && 'code' in err && err.code === '42P17');
                  toast({
                    title: 'Error creating store',
                    description: isPolicyRecursion
                      ? 'Server policy/trigger recursion detected. Check profiles RLS and admin policies (see console/sql).' 
                      : message,
                    variant: 'destructive',
                  });
                  if (isPolicyRecursion) console.error('Policy recursion error creating seller:', err);
                }
              } catch (ex) {
                console.error('Unexpected error creating seller', ex);
                toast({ title: 'Error creating store', description: String(ex), variant: 'destructive' });
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
    { id: 'inventory', label: 'Inventory', icon: ClipboardList },
    { id: 'settings', label: t('dashboard.tabs.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppTour setActiveTab={setActiveTab} />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-8 h-8 shrink-0 bg-gradient-brand rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-foreground leading-tight">ApnaBazar</h1>
                  <p className="truncate text-[11px] text-muted-foreground leading-tight">{seller.store_name}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <LanguageSwitcher variant="compact" id="tour-language" />
                <FeedbackModal />
                <Button variant="ghost" size="sm" onClick={startTour} title="Help Tour" className="shrink-0 text-muted-foreground hover:text-primary">
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut} title={t('common.signOut')} className="shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
              <div className="flex w-max items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyStoreLink}
                  className="shrink-0 border-border/50 text-xs"
                >
                  {copied ? <Check className="mr-1.5 w-3.5 h-3.5" /> : <Copy className="mr-1.5 w-3.5 h-3.5" />}
                  <span>{copied ? t('dashboard.copied') : t('dashboard.copyLink')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/store/${seller.store_slug}`)}
                  className="shrink-0 border-border/50 text-xs"
                >
                  <ExternalLink className="mr-1.5 w-3.5 h-3.5" />
                  <span>{t('dashboard.viewStore')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        {/* Stats */}
        <div id="tour-welcome" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
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
        <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-1 rounded-xl bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              data-tour={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
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
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'products' && (
            <div>
              {products.length > 0 ? (
                <>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{t('dashboard.catalog')} ({products.length})</h2>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('upload')} className="w-full border-border/50 sm:w-auto">
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

          {activeTab === 'inventory' && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Inventory Management</h2>
              <InventoryEditor products={products} onUpdate={updateProduct} />
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

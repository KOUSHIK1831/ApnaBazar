import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Seller, Product } from '@/hooks/useSeller';
import { useAuth } from '@/hooks/useAuth';
import BuyerAuthModal from '@/components/BuyerAuthModal';
import OrderConfirmation from '@/components/OrderConfirmation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, MapPin, Phone, Hash, ShoppingBag, MessageCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

function StorefrontContent() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [orderedProduct, setOrderedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('store_slug', slug)
        .single();

      if (!sellerData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleOrder = async (product: Product) => {
    if (!user) {
      setPendingProduct(product);
      setShowAuth(true);
      return;
    }
    await placeOrder(product);
  };

  const placeOrder = async (product: Product) => {
    try {
      const { error } = await supabase.from('orders').insert({
        buyer_id: user!.id,
        seller_id: product.seller_id,
        product_id: product.id,
        quantity: 1,
        status: 'pending',
        buyer_name: user!.email,
        buyer_phone: '',
      });

      if (error) {
        console.error('Order error:', error);
        toast({ title: 'Order failed', description: 'Could not place order. Please try again.', variant: 'destructive' });
        return;
      }

      setOrderedProduct(product);
      setShowOrderConfirm(true);
      toast({ title: t('storefront.orderPlaced'), description: t('storefront.orderSent') });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (pendingProduct) {
      // Small delay to let auth state propagate
      setTimeout(() => placeOrder(pendingProduct), 500);
      setPendingProduct(null);
    }
  };

  const handleContact = () => {
    if (seller?.contact_number) {
      window.open(`tel:${seller.contact_number}`, '_self');
    } else if (seller?.phone) {
      window.open(`tel:${seller.phone}`, '_self');
    } else {
      toast({ title: t('storefront.contactUnavailable'), description: t('storefront.contactUnavailableDesc') });
    }
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];
  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto mb-16" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('storefront.storeNotFound')}</h1>
          <p className="text-muted-foreground">{t('storefront.storeNotFoundDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-brand opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-6 py-12 text-white">
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{seller?.store_name}</h1>
              {seller?.location && (
                <p className="text-sm opacity-80 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {seller.location}
                  {seller.store_number && <span> · {seller.store_number}</span>}
                </p>
              )}
            </div>
          </div>
          
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher variant="compact" />
            </div>
          </div>

          {seller?.store_description && (
            <p className="text-white/80 max-w-xl mb-4 animate-slide-up">{seller.store_description}</p>
          )}
          <div className="flex flex-wrap gap-2 animate-slide-up">
            {(seller?.contact_number || seller?.phone) && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={handleContact}
              >
                <Phone className="w-3.5 h-3.5 mr-1.5" /> {seller.contact_number || seller.phone}
              </Button>
            )}
            {seller?.store_number && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-md text-sm backdrop-blur-sm">
                <Hash className="w-3.5 h-3.5" /> {seller.store_number}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Maps */}
      {seller?.maps_url && (
        <div className="max-w-5xl mx-auto px-6 -mt-4 relative z-10 mb-8">
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-surface-lg">
            <iframe
              src={seller.maps_url}
              width="100%"
              height="200"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Store Location"
            />
          </div>
        </div>
      )}

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-primary text-white shadow-surface'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('storefront.all')} ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-surface'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat} ({products.filter((p) => p.category === cat).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('storefront.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-card rounded-xl border border-border/50 overflow-hidden shadow-surface hover:shadow-surface-lg transition-all duration-300"
              >
                {product.image_url && (
                  <div className="aspect-[4/5] overflow-hidden bg-secondary">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground leading-tight">{product.title}</h3>
                    <span className="font-bold text-primary tabular-nums ml-2 shrink-0 text-lg">₹{product.price}</span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{product.description}</p>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {product.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-brand hover:opacity-90 transition-opacity"
                      onClick={() => handleOrder(product)}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Order Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border/50"
                      onClick={handleContact}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 mt-12 py-8 border-t border-border/50 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-gradient-brand rounded-md flex items-center justify-center">
            <Store className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-foreground">{t('storefront.poweredBy')}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{t('storefront.empowering')}</p>
      </footer>

      {/* Auth Modal */}
      <BuyerAuthModal
        isOpen={showAuth}
        onClose={() => { setShowAuth(false); setPendingProduct(null); }}
        onSuccess={handleAuthSuccess}
        storeName={seller?.store_name || undefined}
      />

      {/* Order Confirmation */}
      <OrderConfirmation
        isOpen={showOrderConfirm}
        onClose={() => { setShowOrderConfirm(false); setOrderedProduct(null); }}
        productTitle={orderedProduct?.title || ''}
        productPrice={orderedProduct?.price || 0}
        sellerName={seller?.store_name || undefined}
        sellerContact={seller?.contact_number || seller?.phone || undefined}
      />
    </div>
  );
}

export default function Storefront() {
  return <StorefrontContent />;
}

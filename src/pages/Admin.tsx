import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Store, 
  Users, 
  Package, 
  ShoppingBag, 
  LayoutDashboard, 
  ArrowLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Ban,
  UserX,
  MessageSquare,
  Clock
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Feedback {
  id: string;
  content: string;
  status: string;
  created_at: string;
  user_id: string;
  seller_id?: string;
  admin_response?: string;
  user_email?: string;
  store_name?: string;
}

interface Profile {
  id: string;
  email: string;
  role: string;
  is_blocked: boolean;
  created_at: string;
}

interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  location: string;
  status: string;
  created_at: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
}

interface Order {
  id: string;
  status: string;
  buyer_name: string;
  created_at: string;
  product: { title: string; price: number };
}

function AdminResponseInput({ initialValue, onSave }: { initialValue: string, onSave: (val: string) => Promise<void> }) {
  const { t } = useLanguage();
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = async () => {
    if (value === initialValue) return;
    setIsSaving(true);
    try {
      await onSave(value);
    } catch (err) {
      console.error("Failed to save admin response:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input 
        placeholder="Write a response to the user..." 
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs h-8"
        disabled={isSaving}
      />
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 text-[10px]"
        disabled={value === initialValue || isSaving}
        onClick={handleSave}
      >
        {isSaving ? t('common.saving') : t('common.save')}
      </Button>
    </div>
  );
}

export default function Admin() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    fetchGlobalStats();

    const channel = supabase
      .channel("admin-all-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "feedback",
        },
        () => fetchGlobalStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => fetchGlobalStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sellers",
        },
        () => fetchGlobalStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => fetchGlobalStats()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        () => fetchGlobalStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGlobalStats = async () => {
    setLoading(true);
    const [profilesRes, sellersRes, productsRes, ordersRes, feedbackRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
    ]);

    if (feedbackRes.error) {
      console.error("Admin: Feedback fetch error:", feedbackRes.error);
    }
    
    setProfiles(profilesRes.data || []);
    setSellers(sellersRes.data || []);
    setTotalProducts(productsRes.count || 0);
    setTotalOrders(ordersRes.count || 0);

    const emailByUserId = new Map((profilesRes.data || []).map((profile) => [profile.id, profile.email]));
    const storeNameBySellerId = new Map((sellersRes.data || []).map((seller) => [seller.id, seller.store_name]));

    setFeedback((feedbackRes.data || []).map((item) => ({
      ...item,
      user_email: emailByUserId.get(item.user_id) || undefined,
      store_name: item.seller_id ? storeNameBySellerId.get(item.seller_id) : undefined,
    })));
    setLoading(false);
  };

  const updateFeedbackStatus = async (id: string, status: string, admin_response?: string) => {
    const updateData: any = { status };
    if (admin_response !== undefined) {
      updateData.admin_response = admin_response;
    }

    const { error } = await supabase.from("feedback").update(updateData).eq("id", id);
    
    if (error) {
      console.error("Admin: Error updating feedback:", error);
      toast({ 
        title: t('admin.toasts.updateFailed'), 
        description: error.message,
        variant: "destructive" 
      });
      throw error;
    } else {
      setFeedback(prev => prev.map(f => f.id === id ? { 
        ...f, 
        status, 
        admin_response: admin_response !== undefined ? admin_response : f.admin_response 
      } : f));
      toast({ title: t('admin.toasts.updateSuccess') });
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm(t('admin.confirm.deleteFeedback'))) return;
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (!error) {
      setFeedback(prev => prev.filter(f => f.id !== id));
      toast({ title: t('admin.toasts.feedbackDeleted') });
    } else {
      toast({
        title: t('admin.toasts.updateFailed'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchSellerDetails = async (seller: Seller) => {
    setSelectedSeller(seller);
    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*, product:products(title, price)").eq("seller_id", seller.id).order("created_at", { ascending: false }),
    ]);
    setSellerProducts(productsRes.data || []);
    setSellerOrders(ordersRes.data || []);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t('admin.confirm.deleteProduct'))) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setSellerProducts(prev => prev.filter(p => p.id !== id));
      setTotalProducts(prev => prev - 1);
      toast({ title: t('admin.toasts.productDeleted') });
    }
  };

  const toggleSellerStatus = async (seller: Seller) => {
    const newStatus = seller.status === 'active' ? 'blocked' : 'active';
    const confirmMsg = newStatus === 'blocked' 
      ? t('admin.confirm.blockStore')
      : t('admin.confirm.unblockStore');
    
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("sellers")
      .update({ status: newStatus })
      .eq("id", seller.id);

    if (!error) {
      const updated = { ...seller, status: newStatus };
      setSelectedSeller(updated);
      setSellers(prev => prev.map(s => s.id === seller.id ? updated : s));
      toast({ 
        title: newStatus === 'blocked' ? t('admin.toasts.storeBlocked') : t('admin.toasts.storeUnblocked'),
        variant: newStatus === 'blocked' ? "destructive" : "default"
      });
    }
  };

  const toggleUserBlock = async (profile: Profile) => {
    const confirmMsg = profile.is_blocked 
      ? t('admin.confirm.unblockUser')
      : t('admin.confirm.blockUser');
    
    if (!confirm(confirmMsg)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_blocked: !profile.is_blocked })
      .eq("id", profile.id);

    if (!error) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_blocked: !p.is_blocked } : p));
      toast({ 
        title: profile.is_blocked ? t('admin.toasts.userUnblocked') : t('admin.toasts.userBlocked'),
        variant: profile.is_blocked ? "default" : "destructive"
      });
    }
  };

  const filteredSellers = sellers.filter(s => 
    (s.store_name?.toLowerCase().includes(search.toLowerCase()) || 
     s.store_slug?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredUsers = profiles.filter(p => 
    p.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-foreground">{t('admin.portal')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block">{t('admin.devMode')}</span>
            <ThemeToggle />
            <LanguageSwitcher variant="compact" />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />{t('common.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {selectedSeller ? (
          <div className="space-y-6 animate-fade-in">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSeller(null)} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('admin.backToOverview')}
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">{selectedSeller.store_name}</h2>
                  <Badge variant={selectedSeller.status === 'active' ? "default" : "destructive"} className="uppercase text-[10px]">
                    {selectedSeller.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Store className="w-3.5 h-3.5" /> /store/{selectedSeller.store_slug}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> {selectedSeller.location || "No location"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open(`/store/${selectedSeller.store_slug}`, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> {t('admin.viewPublicStore')}
                </Button>
                <Button 
                  variant={selectedSeller.status === 'active' ? "destructive" : "default"} 
                  size="sm" 
                  onClick={() => toggleSellerStatus(selectedSeller)}
                >
                  {selectedSeller.status === 'active' ? (
                    <><Ban className="w-4 h-4 mr-2" /> {t('admin.blockStore')}</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" /> {t('admin.unblockStore')}</>
                  )}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1">
                <TabsTrigger value="inventory">{t('admin.inventory')} ({sellerProducts.length})</TabsTrigger>
                <TabsTrigger value="orders">{t('admin.orders')} ({sellerOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sellerProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden border-border/50 shadow-surface group">
                      <div className="aspect-square relative overflow-hidden bg-muted">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                        <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md">
                          ₹{product.price}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                          <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="w-full mt-4 text-destructive hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> {t('product.delete')}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {sellerProducts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
                    {t('admin.noProductsFound')}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <Card className="border-border/50 shadow-surface overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">{t('admin.orders')} ID</th>
                          <th className="text-left py-3 px-4 font-medium">{t('orders.customer')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.products')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.status')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.joined')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-3 px-4 font-mono text-[10px]">{order.id.slice(0, 8)}...</td>
                            <td className="py-3 px-4">{order.buyer_name}</td>
                            <td className="py-3 px-4">{order.product?.title || t('dashboard.noProducts')}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-[10px] uppercase">{order.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Global Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50 shadow-surface">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> {t('admin.users')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-surface">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Store className="w-3.5 h-3.5" /> {t('admin.sellers')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{sellers.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-surface">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> {t('admin.products')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-surface">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" /> {t('admin.orders')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="sellers" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 p-1">
                <TabsTrigger value="sellers">{t('admin.sellers')}</TabsTrigger>
                <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
                <TabsTrigger value="feedback">{t('admin.feedback')} ({feedback.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="sellers" className="space-y-4">
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('admin.searchStores')} 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredSellers.map((seller) => (
                    <Card key={seller.id} className="border-border/50 shadow-surface hover:shadow-surface-lg transition-all cursor-pointer group" onClick={() => fetchSellerDetails(seller)}>
                      <CardHeader className="p-5 flex flex-row items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{seller.store_name}</CardTitle>
                            {seller.status === 'blocked' && (
                              <Badge variant="destructive" className="text-[8px] uppercase h-4">Blocked</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs mt-1">/store/{seller.store_slug}</CardDescription>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('admin.searchUsers')} 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Card className="border-border/50 shadow-surface overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-muted-foreground">
                          <th className="text-left py-3 px-4 font-medium">{t('admin.userEmail')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.role')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.status')}</th>
                          <th className="text-left py-3 px-4 font-medium">{t('admin.joined')}</th>
                          <th className="text-right py-3 px-4 font-medium">{t('admin.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((profile) => (
                          <tr key={profile.id} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-3 px-4 font-medium">{profile.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary" className="text-[10px] uppercase">{profile.role}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {profile.is_blocked ? (
                                <Badge variant="destructive" className="text-[10px] flex items-center gap-1 w-fit">
                                  <ShieldAlert className="w-3 h-3" /> BLOCKED
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] flex items-center gap-1 w-fit text-green-600 border-green-600/30 bg-green-500/5">
                                  <ShieldCheck className="w-3 h-3" /> ACTIVE
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {new Date(profile.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {profile.role !== 'admin' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => toggleUserBlock(profile)}
                                  className={profile.is_blocked ? "text-green-600 hover:text-green-700 hover:bg-green-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                                >
                                  {profile.is_blocked ? <ShieldCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="feedback" className="mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {feedback.map((item) => (
                    <Card key={item.id} className="border-border/50 shadow-surface overflow-hidden">
                      <CardHeader className="p-4 bg-muted/20 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.status === 'open' ? 'bg-amber-100 text-amber-600' : 
                            item.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-sm font-semibold">{item.user_email || 'Anonymous/Deleted'}</CardTitle>
                              {item.store_name && (
                                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none whitespace-nowrap">
                                  <Store className="w-3 h-3 mr-1" /> {item.store_name}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-[10px] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <select 
                            value={item.status} 
                            onChange={(e) => updateFeedbackStatus(item.id, e.target.value, item.admin_response)}
                            className="text-[10px] bg-background border border-border/50 rounded px-2 py-1 outline-none"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <Badge variant={item.status === 'open' ? "destructive" : item.status === 'resolved' ? "default" : "outline"} className="text-[8px] uppercase">
                            {t(`orders.status.${item.status}` as any)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFeedback(item.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Delete feedback"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin.userMessage')}</p>
                          <p className="text-sm text-foreground leading-relaxed italic">"{item.content}"</p>
                        </div>
                        
                        <div className="pt-3 border-t border-border/30">
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {t('feedback.adminResponse')}
                          </p>
                          <AdminResponseInput 
                            initialValue={item.admin_response || ""} 
                            onSave={(val) => updateFeedbackStatus(item.id, item.status, val)} 
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {feedback.length === 0 && (
                    <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('admin.noFeedbackReceived')}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

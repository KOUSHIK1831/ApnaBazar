import { Order } from '@/hooks/useSeller';
import { useLanguage } from '@/i18n/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingBag, 
  User, 
  Calendar, 
  MessageCircle, 
  Phone, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface OrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<any>;
}

export default function Orders({ orders, onUpdateStatus }: OrdersProps) {
  const { t } = useLanguage();

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5 mr-1" />;
      case 'confirmed': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
      case 'cancelled': return <XCircle className="w-3.5 h-3.5 mr-1" />;
    }
  };

  const getWhatsAppLink = (phone: string, order: Order) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hi, I am the seller from ApnaBazar. I received your order for "${order.product?.title}". Status: ${order.status.toUpperCase()}.`;
    return `https://wa.me/${cleanPhone}/?text=${encodeURIComponent(message)}`;
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm animate-fade-in">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{t('orders.noOrders')}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Share your store link with customers to start receiving orders!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          {t('orders.title')}
          <Badge variant="secondary" className="ml-2 font-mono">{orders.length}</Badge>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => (
          <Card 
            key={order.id} 
            className="overflow-hidden border-border/50 shadow-surface hover:shadow-surface-lg transition-all duration-300 group"
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Product Info */}
                <div className="p-5 flex-1 flex gap-4 border-b md:border-b-0 md:border-r border-border/50 bg-muted/5">
                  {order.product?.image_url ? (
                    <div className="w-20 h-24 rounded-lg overflow-hidden bg-secondary shrink-0 shadow-sm">
                      <img 
                        src={order.product.image_url} 
                        alt={order.product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-24 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(order.created_at), 'MMM dd, yyyy • HH:mm')}
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                      {order.product?.title || t('orders.product')}
                    </h3>
                    <p className="text-primary font-mono font-bold">₹{order.product?.price || 0}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-5 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t('orders.customer')}</p>
                      <p className="font-medium text-foreground truncate max-w-[180px]">{order.buyer_name || 'Buyer'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {t(`orders.status.${order.status}`)}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 flex flex-col justify-center gap-2 bg-muted/5 min-w-[200px]">
                  <div className="flex gap-2 mb-1">
                    {order.buyer_phone && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 bg-green-500/5 hover:bg-green-500/10 border-green-500/20 text-green-600 h-9"
                        onClick={() => window.open(getWhatsAppLink(order.buyer_phone!, order), '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 h-9 border-border/50"
                      onClick={() => order.buyer_phone && window.open(`tel:${order.buyer_phone}`, '_self')}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        className="col-span-2 bg-gradient-brand hover:opacity-90 transition-opacity h-9"
                        onClick={() => onUpdateStatus(order.id, 'confirmed')}
                      >
                        Confirm Order
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="col-span-2 bg-green-600 hover:bg-green-700 h-9"
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                      >
                        Ship Order
                      </Button>
                    )}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="col-span-2 text-xs text-muted-foreground hover:text-red-600 hover:bg-red-50 h-8"
                        onClick={() => onUpdateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

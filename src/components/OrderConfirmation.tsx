import { Button } from '@/components/ui/button';
import { CheckCircle2, Phone, Store } from 'lucide-react';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  productPrice: number;
  sellerName?: string;
  sellerContact?: string;
}

export default function OrderConfirmation({
  isOpen,
  onClose,
  productTitle,
  productPrice,
  sellerName,
  sellerContact,
}: OrderConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 bg-card rounded-2xl shadow-2xl border border-border/50 animate-slide-up overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Order Placed!</h2>
          <p className="text-sm text-muted-foreground mb-6">Your order has been sent to the seller</p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium text-foreground">{productTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium text-foreground">₹{productPrice}</span>
            </div>
            {sellerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seller</span>
                <span className="font-medium text-foreground">{sellerName}</span>
              </div>
            )}
          </div>

          {sellerContact && (
            <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>Contact seller: <span className="font-medium text-foreground">{sellerContact}</span></span>
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-gradient-brand hover:opacity-90 transition-opacity">
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}

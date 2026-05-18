import { useState } from 'react';
import { Product } from '@/hooks/useSeller';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X, IndianRupee } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProductCardProps {
  product: Product;
  editable?: boolean;
  onUpdate?: (id: string, updates: Partial<Product>) => Promise<unknown>;
  onDelete?: (id: string) => Promise<unknown>;
}

export default function ProductCard({ product, editable = false, onUpdate, onDelete }: ProductCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState<string | null>(null);

  const title = draftTitle ?? product.title;
  const price = draftPrice ?? String(product.price);
  const description = draftDescription ?? (product.description || '');

  const { t } = useLanguage();

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(product.id, {
        title,
        price: parseFloat(price),
        description,
      });
      setEditing(false);
      setDraftTitle(null);
      setDraftPrice(null);
      setDraftDescription(null);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDraftTitle(null);
    setDraftPrice(null);
    setDraftDescription(null);
  };

  return (
    <Card className="group overflow-hidden shadow-surface hover:shadow-surface-lg hover:-translate-y-1 transition-all duration-300 border-border/50 rounded-xl">
      {product.image_url && (
        <div className="aspect-[4/5] overflow-hidden bg-secondary">
          <img
            src={product.image_url}
            alt={product.title}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="p-5">
        {editing ? (
          <div className="space-y-3">

            <Input value={title} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Title" />
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={price}
                onChange={(e) => setDraftPrice(e.target.value)}
                placeholder={t('product.price')}
                type="number"
                className="pl-8"
              />
            </div>
            <Input value={description} onChange={(e) => setDraftDescription(e.target.value)} placeholder="Description" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="bg-gradient-brand hover:opacity-90 transition-opacity">
                <Check className="size-4 mr-1" /> {t('common.save')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="border-border/50">
                <X className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-foreground leading-tight">{product.title}</h3>
              <span className="font-bold text-primary tabular-nums ml-2 shrink-0">₹{product.price}</span>
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{product.description}</p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {product.category && (
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
            )}
            {product.stock !== undefined && (
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  product.stock === 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : product.stock <= (product.low_stock_threshold || 5)
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {product.stock === 0 ? 'Out of Stock' : `In Stock (${product.stock})`}
                </span>
              </div>
            )}
            {editable && (
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="size-3.5 mr-1" /> {t('product.edit')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  if (confirm(t('product.deleteConfirm'))) onDelete?.(product.id);
                }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5 mr-1" /> {t('product.delete')}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

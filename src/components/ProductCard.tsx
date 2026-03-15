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
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(String(product.price));
  const [description, setDescription] = useState(product.description || '');
  const { t } = useLanguage();

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(product.id, {
        title,
        price: parseFloat(price),
        description,
      });
    }
    setEditing(false);
  };

  return (
    <Card className="group overflow-hidden shadow-surface hover:shadow-surface-lg transition-all duration-300 border-border/50 rounded-xl">
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
      <CardContent className="p-5">
        {editing ? (
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={t('product.price')}
                type="number"
                className="pl-8"
              />
            </div>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="bg-gradient-brand hover:opacity-90 transition-opacity">
                <Check className="w-4 h-4 mr-1" /> {t('common.save')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="border-border/50">
                <X className="w-4 h-4" />
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
            {editable && (
              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5 mr-1" /> {t('product.edit')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  if (confirm(t('product.deleteConfirm'))) onDelete?.(product.id);
                }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> {t('product.delete')}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

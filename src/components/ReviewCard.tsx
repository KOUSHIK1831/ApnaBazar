import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Image as ImageIcon, Edit3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface AIProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  confidence?: {
    title: number;
    description: number;
    price: number;
    category: number;
    tags: number;
  };
}

interface ReviewCardProps {
  product: AIProduct;
  imageUrl: string;
  index: number;
  onApprove: (product: AIProduct) => void;
  onReject: () => void;
}

const CONFIDENCE_THRESHOLD = 0.7;

export default function ReviewCard({ product, imageUrl, index, onApprove, onReject }: ReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState<AIProduct>({ ...product });
  const { t } = useLanguage();

  const handleSave = () => {
    onApprove(edited);
    setEditing(false);
  };

  const isLowConfidence = (field: keyof NonNullable<AIProduct['confidence']>) => {
    return product.confidence && (product.confidence[field] < CONFIDENCE_THRESHOLD);
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-surface animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/50">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Product {index + 1}
        </span>
        <span className="text-xs text-muted-foreground">
          {product.title}
        </span>
      </div>
      <div className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-secondary shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input
                    value={edited.title}
                    onChange={(e) => setEdited({ ...edited, title: e.target.value })}
                    placeholder="Title"
                    className={isLowConfidence('title') ? "border-amber-300 bg-amber-50/30" : ""}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input
                    type="number"
                    value={edited.price}
                    onChange={(e) => setEdited({ ...edited, price: parseFloat(e.target.value) || 0 })}
                    placeholder="Price"
                    className={isLowConfidence('price') ? "border-amber-300 bg-amber-50/30" : ""}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Input
                  value={edited.category}
                  onChange={(e) => setEdited({ ...edited, category: e.target.value })}
                  placeholder="Category"
                  className={isLowConfidence('category') ? "border-amber-300 bg-amber-50/30" : ""}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  value={edited.description}
                  onChange={(e) => setEdited({ ...edited, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className={isLowConfidence('description') ? "border-amber-300 bg-amber-50/30" : ""}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
                <Input
                  value={edited.tags.join(", ")}
                  onChange={(e) => setEdited({ ...edited, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="tag1, tag2, tag3"
                  className={isLowConfidence('tags') ? "border-amber-300 bg-amber-50/30" : ""}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <h4 className={`font-semibold text-foreground leading-tight ${isLowConfidence('title') ? "bg-amber-100/50 rounded px-1 -mx-1" : ""}`}>
                  {product.title}
                </h4>
                <span className={`font-bold text-primary tabular-nums shrink-0 ${isLowConfidence('price') ? "bg-amber-100/50 rounded px-1 -mx-1" : ""}`}>
                  ₹{product.price}
                </span>
              </div>
              <p className={`text-sm text-muted-foreground line-clamp-2 ${isLowConfidence('description') ? "bg-amber-50/50 rounded px-1 -mx-1 border border-amber-100/50" : ""}`}>
                {product.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={isLowConfidence('category') ? "outline" : "secondary"} className={`text-[10px] ${isLowConfidence('category') ? "border-amber-500 text-amber-600 bg-amber-50" : ""}`}>
                  {product.category}
                </Badge>
              </div>
              {product.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1 p-1 -m-1 rounded ${isLowConfidence('tags') ? "bg-amber-50/30 border border-amber-100/50" : ""}`}>
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] border-border/50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
          <div className="flex items-center gap-2 pt-2">
            {editing ? (
              <>
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Save & Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEdited({ ...product }); setEditing(false); }}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" className="bg-gradient-brand hover:opacity-90 transition-opacity" onClick={() => onApprove(product)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="border-border/50" onClick={() => setEditing(true)}>
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onReject}>
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

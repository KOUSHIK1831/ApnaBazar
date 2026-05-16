import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';
import { compressImage } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import ReviewCard from './ReviewCard';

interface AIProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
}

interface PendingReview {
  product: AIProduct;
  imageUrl: string;
  fileId: string;
}

interface UploadZoneProps {
  sellerId: string;
  onComplete: () => void;
}

type ProcessingStep = 'idle' | 'uploading' | 'processing' | 'review' | 'complete' | 'error';

export default function UploadZone({ sellerId, onComplete }: UploadZoneProps) {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [currentFileName, setCurrentFileName] = useState('');
  const [overridePrice, setOverridePrice] = useState('');
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);
  const startTimeRef = useRef(0);
  const { toast } = useToast();
  const { t } = useLanguage();

  const approveProduct = useCallback(async (product: AIProduct, imageUrl: string) => {
    const { error } = await supabase.from('products').insert({
      seller_id: sellerId,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags || [],
      image_url: imageUrl,
    });
    if (error) {
      toast({ title: 'Error', description: `Failed to save product: ${error.message}`, variant: 'destructive' });
      return false;
    }
    trackEvent('product_uploaded', { category: product.category, price: product.price });
    trackEvent('ai_digitization_complete', { category: product.category });
    return true;
  }, [sellerId, toast]);

  const rejectProduct = useCallback((fileId: string) => {
    supabase.from('files').update({ status: 'rejected' }).eq('id', fileId);
  }, []);

  const handleApproveReview = useCallback(async (product: AIProduct, imageUrl: string, fileId: string) => {
    const ok = await approveProduct(product, imageUrl);
    if (ok) {
      setApprovedCount((prev) => prev + 1);
      setPendingReviews((prev) => prev.filter((r) => r.fileId !== fileId));
    }
  }, [approveProduct]);

  const handleRejectReview = useCallback((fileId: string) => {
    rejectProduct(fileId);
    setPendingReviews((prev) => prev.filter((r) => r.fileId !== fileId));
  }, [rejectProduct]);

  // Transition to complete when all reviews are handled
  useEffect(() => {
    if (step === 'review' && pendingReviews.length === 0 && approvedCount > 0) {
      setStep('complete');
      onComplete();
    }
  }, [step, pendingReviews.length, approvedCount, onComplete]);

  const processFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setFileCount(files.length);
    setProcessedCount(0);
    setStep('uploading');
    startTimeRef.current = Date.now();

    try {
      // Upload files to storage and create file records
      const uploadedFiles: { fileUrl: string; fileId: string }[] = [];

      for (const file of files) {
        setCurrentFileName(file.name);
        let fileToUpload: File | Blob = file;
        
        // Compress images over 150KB to target ~100KB for AI and fast upload
        if (file.type.startsWith('image/') && file.size > 150 * 1024) {
          try {
            fileToUpload = await compressImage(file);
            console.log(`[Compression Success] ${file.name}: ${(file.size / 1024).toFixed(1)}KB -> ${(fileToUpload.size / 1024).toFixed(1)}KB`);
          } catch (compressError) {
            console.error(`[Compression Failed] ${file.name}:`, compressError);
            toast({
              title: 'Compression Warning',
              description: `Failed to compress ${file.name}, uploading original.`,
              variant: 'default'
            });
          }
        }

        const ext = file.name.split('.').pop();
        const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(path, fileToUpload);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          toast({ 
            title: 'Storage Error', 
            description: `Failed to upload ${file.name}: ${uploadError.message}`, 
            variant: 'destructive' 
          });
          continue;
        }

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);

        const { data: fileRecord, error: insertError } = await supabase
          .from('files')
          .insert({
            seller_id: sellerId,
            file_url: urlData.publicUrl,
            file_type: file.type,
            status: 'pending',
          })
          .select()
          .single();

        if (insertError) {
          console.error('File record insert error:', insertError);
          toast({ 
            title: 'Database Error', 
            description: `Failed to create record for ${file.name}: ${insertError.message}`, 
            variant: 'destructive' 
          });
          continue;
        }

        if (fileRecord) {
          uploadedFiles.push({ fileUrl: urlData.publicUrl, fileId: fileRecord.id, fileName: file.name });
        }
      }

      if (uploadedFiles.length === 0) {
        setStep('error');
        return;
      }

      // Process each file with AI
      setStep('processing');

      const priceOverride = overridePrice ? parseFloat(overridePrice) : null;
      let successCount = 0;
      let localProcessedCount = 0;
      const reviews: PendingReview[] = [];

      for (const { fileUrl, fileId, fileName } of uploadedFiles) {
        try {
          setCurrentFileName(fileName);
          await supabase.from('files').update({ status: 'processing' }).eq('id', fileId);

          const { data, error: invokeError } = await supabase.functions.invoke('digitize', {
            body: { imageUrl: fileUrl, sellerId },
          });

          if (invokeError) {
            console.error('Edge function invocation error:', invokeError);
            throw new Error(`AI processing failed: ${invokeError.message || 'Unknown error'}`);
          }

          if (data?.product) {
            reviews.push({
              product: {
                title: data.product.title,
                description: data.product.description,
                price: priceOverride ?? data.product.price ?? 0,
                category: data.product.category,
                tags: data.product.tags || [],
              },
              imageUrl: fileUrl,
              fileId,
            });
            successCount++;
          } else {
            throw new Error('AI digitization did not return a valid product.');
          }

          await supabase.from('files').update({ status: 'completed' }).eq('id', fileId);
          localProcessedCount++;
          setProcessedCount(localProcessedCount);
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const avgPerFile = elapsed / localProcessedCount;
          const remaining = Math.max(0, Math.round(avgPerFile * (fileCount - localProcessedCount)));
          setEstimatedSeconds(remaining);
        } catch (err) {
          console.error('Processing error:', err);
          await supabase.from('files').update({ status: 'failed' }).eq('id', fileId);
          localProcessedCount++;
          setProcessedCount(localProcessedCount);
          toast({ 
            title: 'Processing Error', 
            description: err instanceof Error ? err.message : 'Something went wrong during AI processing', 
            variant: 'destructive' 
          });
        }
      }

      if (successCount === 0 && uploadedFiles.length > 0) {
        setStep('error');
      } else {
        setPendingReviews(reviews);
        setApprovedCount(0);
        setStep('review');
      }
    } catch (err) {
      console.error(err);
      setStep('error');
      toast({ title: 'Error', description: 'Critical error during processing flow.', variant: 'destructive' });
    }
  }, [sellerId, onComplete, toast, overridePrice, fileCount]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  }, [processFiles]);

  if (step === 'complete') {
    return (
      <div className="border border-border/50 rounded-xl p-12 flex flex-col items-center bg-card shadow-surface animate-fade-in">
        <div className="w-14 h-14 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">Digitization Complete</h3>
        <p className="text-sm text-muted-foreground mb-6">{fileCount} files processed successfully</p>
        <Button variant="outline" onClick={() => { setStep('idle'); setOverridePrice(''); }} className="border-border/50">Upload More</Button>
      </div>
    );
  }

  if (step === 'uploading' || step === 'processing') {
    return (
      <div className="border border-border/50 rounded-xl p-12 flex flex-col items-center bg-card shadow-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <h3 className="font-semibold text-foreground mb-1">
          {step === 'uploading' ? t('upload.processing') : 'AI is digitizing your catalog...'}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">
          {currentFileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {processedCount + 1} / {fileCount} files
        </p>
        <div className="mt-4 w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${fileCount > 0 ? (processedCount / fileCount) * 100 : 0}%` }}
          />
        </div>
        {estimatedSeconds > 0 && (
          <p className="text-xs text-muted-foreground mt-2">~{estimatedSeconds}s remaining</p>
        )}
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Review Products</h3>
          <p className="text-sm text-muted-foreground">{pendingReviews.length} pending · {approvedCount} approved</p>
        </div>
        <p className="text-sm text-muted-foreground">Review the AI-extracted product details. Approve to publish, edit to correct, or reject to discard.</p>
        <div className="space-y-4">
          {pendingReviews.map((review) => (
            <ReviewCard
              key={review.fileId}
              product={review.product}
              imageUrl={review.imageUrl}
              index={0}
              onApprove={(product) => handleApproveReview(product, review.imageUrl, review.fileId)}
              onReject={() => handleRejectReview(review.fileId)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="border border-destructive/30 rounded-xl p-12 flex flex-col items-center bg-card shadow-surface animate-fade-in">
        <XCircle className="w-8 h-8 text-destructive mb-4" />
        <h3 className="font-semibold text-foreground mb-1">Processing Failed</h3>
        <p className="text-sm text-muted-foreground mb-6">Some files could not be processed</p>
        <Button variant="outline" onClick={() => setStep('idle')} className="border-border/50">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Override */}
      <div className="border border-border/50 rounded-xl p-5 bg-card shadow-surface">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('upload.price')}</h3>
            <p className="text-xs text-muted-foreground">Optional — override AI-estimated price for all uploads in this batch</p>
          </div>
        </div>
        <Input
          type="number"
          value={overridePrice}
          onChange={(e) => setOverridePrice(e.target.value)}
          placeholder="e.g. 999 (leave empty for AI estimate)"
          className="max-w-xs"
          min="0"
          step="1"
        />
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center bg-card shadow-surface transition-all duration-200 cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/50 hover:border-border'
        }`}
      >
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">{t('upload.dragDrop')}</h3>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">{t('upload.supported')}</p>
        <label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <Button variant="default" asChild className="bg-gradient-brand hover:opacity-90 transition-opacity">
            <span>{t('upload.orClick')}</span>
          </Button>
        </label>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageContext';

interface UploadZoneProps {
  sellerId: string;
  onComplete: () => void;
}

type ProcessingStep = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

export default function UploadZone({ sellerId, onComplete }: UploadZoneProps) {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [overridePrice, setOverridePrice] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const processFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setFileCount(files.length);
    setProcessedCount(0);
    setStep('uploading');

    try {
      // Upload files to storage and create file records
      const uploadedFiles: { fileUrl: string; fileId: string }[] = [];

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(path, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);

        const { data: fileRecord } = await supabase
          .from('files')
          .insert({
            seller_id: sellerId,
            file_url: urlData.publicUrl,
            file_type: file.type,
            status: 'pending',
          })
          .select()
          .single();

        if (fileRecord) {
          uploadedFiles.push({ fileUrl: urlData.publicUrl, fileId: fileRecord.id });
        }
      }

      if (uploadedFiles.length === 0) {
        setStep('error');
        toast({ title: 'Upload failed', description: 'No files could be uploaded.', variant: 'destructive' });
        return;
      }

      // Process each file with AI
      setStep('processing');

      const priceOverride = overridePrice ? parseFloat(overridePrice) : null;

      for (const { fileUrl, fileId } of uploadedFiles) {
        try {
          await supabase.from('files').update({ status: 'processing' }).eq('id', fileId);

          const { data, error } = await supabase.functions.invoke('digitize', {
            body: { imageUrl: fileUrl, sellerId },
          });

          if (error) throw error;

          if (data?.product) {
            await supabase.from('products').insert({
              seller_id: sellerId,
              title: data.product.title,
              description: data.product.description,
              price: priceOverride ?? data.product.price ?? 0,
              category: data.product.category,
              tags: data.product.tags || [],
              image_url: fileUrl,
            });
          }

          await supabase.from('files').update({ status: 'completed' }).eq('id', fileId);
          setProcessedCount((prev) => prev + 1);
        } catch (err) {
          console.error('Processing error:', err);
          await supabase.from('files').update({ status: 'failed' }).eq('id', fileId);
          setProcessedCount((prev) => prev + 1);
        }
      }

      setStep('complete');
      toast({ title: 'Digitization complete', description: `${uploadedFiles.length} files processed.` });
      onComplete();
    } catch (err) {
      console.error(err);
      setStep('error');
      toast({ title: 'Error', description: 'Something went wrong during processing.', variant: 'destructive' });
    }
  }, [sellerId, onComplete, toast, overridePrice]);

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
        <p className="text-sm text-muted-foreground">
          {step === 'processing' && `${processedCount} / ${fileCount} files processed`}
        </p>
        <div className="mt-4 w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${fileCount > 0 ? (processedCount / fileCount) * 100 : 0}%` }}
          />
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

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Seller } from '@/hooks/useSeller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, MapPin, Phone, Hash, Store, FileText, Loader2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const THEME_COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#6366F1', '#14B8A6', '#84CC16', '#F97316', '#06B6D4', '#A855F7',
];

interface StoreSettingsProps {
  seller: Seller;
  onUpdate: (updates: Partial<Seller>) => Promise<{ error: unknown } | undefined>;
}

export default function StoreSettings({ seller, onUpdate }: StoreSettingsProps) {
  const [storeName, setStoreName] = useState(seller.store_name || '');
  const [storeDescription, setStoreDescription] = useState(seller.store_description || '');
  const [location, setLocation] = useState(seller.location || '');
  const [contactNumber, setContactNumber] = useState(seller.contact_number || seller.phone || '');
  const [storeNumber, setStoreNumber] = useState(seller.store_number || '');
  const [mapsUrl, setMapsUrl] = useState(seller.maps_url || '');
  const [bannerUrl, setBannerUrl] = useState(seller.banner_url || '');
  const [themeColor, setThemeColor] = useState(seller.theme_color || '#8B5CF6');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `banners/${seller.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);
      setBannerUrl(urlData.publicUrl);
      toast({ title: 'Banner uploaded' });
    } catch (err) {
      toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
    }
    setUploadingBanner(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await onUpdate({
      store_name: storeName,
      store_slug: generatedSlug,
      store_description: storeDescription,
      location,
      contact_number: contactNumber,
      store_number: storeNumber,
      maps_url: mapsUrl,
      banner_url: bannerUrl,
      theme_color: themeColor,
    });
    setSaving(false);
    if (result?.error) {
      toast({ title: t('common.error'), description: t('settings.saveError'), variant: 'destructive' });
    } else {
      toast({ title: t('common.saved'), description: t('settings.saveSuccess') });
    }
  };

  const generatedSlug = `${storeName} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Store Info */}
      <Card className="shadow-surface border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{t('settings.storeInfo')}</CardTitle>
              <CardDescription className="text-xs">{t('settings.storeInfoDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('settings.storeName')}</label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Boutique" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('settings.storeDescription')}</label>
            <textarea
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder={t('settings.storeDescPlaceholder')}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('settings.storeUrlLabel')}</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">apnabazar.store/</span>
              <span className="text-sm font-medium text-foreground">{generatedSlug || seller.store_slug}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.shareLink')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Location & Maps */}
      <Card className="shadow-surface border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base">{t('settings.locationMaps')}</CardTitle>
              <CardDescription className="text-xs">{t('settings.locationMapsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('settings.storeAddress')}</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="123 Main Street, Mumbai, India" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t('settings.mapsUrl')}</label>
            <Input
              value={mapsUrl}
              onChange={(e) => {
                let val = e.target.value;
                if (val.includes('<iframe') && val.includes('src="')) {
                  const match = val.match(/src="([^"]+)"/);
                  if (match && match[1]) {
                    val = match[1];
                  }
                }
                setMapsUrl(val);
              }}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <p className="text-xs text-muted-foreground">{t('settings.mapsHelp')}</p>
            {mapsUrl && !mapsUrl.includes('google.com/maps/embed') && (
              <p className="text-xs text-destructive mt-1">{t('settings.mapsWarning')}</p>
            )}
          </div>
          {mapsUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <iframe
                src={mapsUrl}
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Store Location"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner & Theme */}
      <Card className="shadow-surface border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-base">Store Banner & Theme</CardTitle>
              <CardDescription className="text-xs">Customize your public storefront look</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Banner Image</label>
            {bannerUrl && (
              <div className="relative rounded-lg overflow-hidden border border-border mb-3">
                <img src={bannerUrl} alt="Store banner" className="w-full h-32 object-cover" />
                <button
                  onClick={() => setBannerUrl('')}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
                >
                  X
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 border border-border/50 rounded-lg text-sm hover:bg-muted/50 transition-colors">
                {uploadingBanner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
                {uploadingBanner ? 'Uploading...' : bannerUrl ? 'Change Banner' : 'Upload Banner'}
              </div>
              <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    themeColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Custom:</span>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border"
              />
              <span className="text-xs font-mono text-muted-foreground">{themeColor}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card className="shadow-surface border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">{t('settings.contactDetails')}</CardTitle>
              <CardDescription className="text-xs">{t('settings.contactDetailsDesc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {t('settings.contactNumber')}
              </label>
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+91 9876543210"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> {t('settings.shopNumber')}
              </label>
              <Input
                value={storeNumber}
                onChange={(e) => setStoreNumber(e.target.value)}
                placeholder="Shop #12, Block A"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.saving')}</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> {t('common.save')}</>
          )}
        </Button>
      </div>
    </div>
  );
}

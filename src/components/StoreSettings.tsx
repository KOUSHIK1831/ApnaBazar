import { useState } from 'react';
import { Seller } from '@/hooks/useSeller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, MapPin, Phone, Hash, Store, FileText, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const generatedSlug = `${storeName} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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
    });
    setSaving(false);
    if (result?.error) {
      toast({ title: t('common.error'), description: t('settings.saveError'), variant: 'destructive' });
    } else {
      toast({ title: t('common.saved'), description: t('settings.saveSuccess') });
    }
  };

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

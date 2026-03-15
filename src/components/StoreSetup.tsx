import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface StoreSetupProps {
  onComplete: (data: {
    store_name: string;
    store_slug: string;
    location: string;
    full_name: string;
    store_description: string;
    contact_number: string;
    store_number: string;
  }) => void;
}

export default function StoreSetup({ onComplete }: StoreSetupProps) {
  const [storeName, setStoreName] = useState('');
  const [location, setLocation] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [storeNumber, setStoreNumber] = useState('');
  const { t } = useLanguage();

  const slug = `${storeName} ${location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      store_name: storeName,
      store_slug: slug,
      location,
      full_name: fullName,
      store_description: storeDescription,
      contact_number: contactNumber,
      store_number: storeNumber,
    });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-fade-in">
      <Card className="w-full max-w-lg shadow-surface-lg border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4">
            <Store className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl">{t('setup.title')}</CardTitle>
          <CardDescription>{t('setup.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('setup.yourName')}</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ravi Kumar" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('setup.contactNumber')}</label>
                <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+91 9876543210" type="tel" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('setup.storeName')}</label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ravi's Boutique" required />
              {slug && (
                <p className="text-xs text-muted-foreground">
                  {t('setup.storeUrl')} <span className="font-medium text-primary">apnabazar.store/{slug}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('setup.storeDescription')}</label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder={t('setup.storeDescPlaceholder')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('setup.location')}</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai, India" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('setup.shopNumber')}</label>
                <Input value={storeNumber} onChange={(e) => setStoreNumber(e.target.value)} placeholder="Shop #12" />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 bg-gradient-brand hover:opacity-90 transition-opacity">
              {t('setup.createStore')} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

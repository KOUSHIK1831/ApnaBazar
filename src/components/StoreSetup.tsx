import { useReducer } from 'react';
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

type State = {
  storeName: string;
  location: string;
  fullName: string;
  storeDescription: string;
  contactNumber: string;
  storeNumber: string;
};

type Action = { type: 'SET_FIELD'; field: keyof State; value: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
}

export default function StoreSetup({ onComplete }: StoreSetupProps) {
  const [state, dispatch] = useReducer(reducer, {
    storeName: '',
    location: '',
    fullName: '',
    storeDescription: '',
    contactNumber: '',
    storeNumber: '',
  });
  const { t } = useLanguage();

  const slug = `${state.storeName} ${state.location}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      store_name: state.storeName,
      store_slug: slug,
      location: state.location,
      full_name: state.fullName,
      store_description: state.storeDescription,
      contact_number: state.contactNumber,
      store_number: state.storeNumber,
    });
  };

  const handleChange = (field: keyof State) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-fade-in">
      <Card className="w-full max-w-lg shadow-surface-lg border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-12 bg-gradient-brand rounded-xl flex items-center justify-center mb-4">
            <Store className="size-6 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold">{t('setup.title')}</CardTitle>
          <CardDescription>{t('setup.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-foreground">{t('setup.yourName')}</label>
                <Input id="fullName" value={state.fullName} onChange={handleChange('fullName')} placeholder="Ravi Kumar" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="contactNumber" className="text-sm font-medium text-foreground">{t('setup.contactNumber')}</label>
                <Input id="contactNumber" value={state.contactNumber} onChange={handleChange('contactNumber')} placeholder="+91 9876543210" type="tel" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="storeName" className="text-sm font-medium text-foreground">{t('setup.storeName')}</label>
              <Input id="storeName" value={state.storeName} onChange={handleChange('storeName')} placeholder="Ravi's Boutique" required />
              {slug && (
                <p className="text-xs text-muted-foreground">
                  {t('setup.storeUrl')} <span className="font-medium text-primary">apnabazar.store/{slug}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="storeDescription" className="text-sm font-medium text-foreground">{t('setup.storeDescription')}</label>
              <textarea
                id="storeDescription"
                value={state.storeDescription}
                onChange={handleChange('storeDescription')}
                placeholder={t('setup.storeDescPlaceholder')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-foreground">{t('setup.location')}</label>
                <Input id="location" value={state.location} onChange={handleChange('location')} placeholder="Mumbai, India" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="storeNumber" className="text-sm font-medium text-foreground">{t('setup.shopNumber')}</label>
                <Input id="storeNumber" value={state.storeNumber} onChange={handleChange('storeNumber')} placeholder="Shop #12" />
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 bg-gradient-brand hover:opacity-90 transition-opacity">
              {t('setup.createStore')} <ArrowRight className="size-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

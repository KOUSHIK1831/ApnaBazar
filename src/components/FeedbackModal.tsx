import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSeller } from '@/hooks/useSeller';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquarePlus, Bug, History, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface FeedbackItem {
  id: string;
  content: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

export default function FeedbackModal() {
  const { user } = useAuth();
  const { seller } = useSeller();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchMyFeedback = async () => {
        setLoadingHistory(true);
        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (!error) {
          setMyFeedback(data || []);
        }
        setLoadingHistory(false);
      };

      fetchMyFeedback();

      const channel = supabase
        .channel('my-feedback-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'feedback',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchMyFeedback();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, user]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const feedbackData: {
        user_id: string | undefined;
        content: string;
        status: string;
        seller_id?: string;
      } = {
        user_id: user?.id,
        content: content.trim(),
        status: 'open',
      };

      // Include seller_id if the user is a seller
      if (seller?.id) {
        feedbackData.seller_id = seller.id;
      }

      const { error } = await supabase.from('feedback').insert(feedbackData);

      if (error) {
        console.error('Feedback: Insert error:', error);
        throw error;
      }

      toast({
        title: t('feedback.success'),
        variant: 'default',
      });
      setContent('');
      // The realtime subscription will refresh history
    } catch (err: unknown) {
      console.error('Feedback: Detailed error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not submit feedback. Please try again.';
      toast({
        title: t('feedback.error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary gap-2"
          title={t('feedback.title')}
          id="tour-feedback"
        >
          <Bug className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <Tabs defaultValue="send" className="w-full flex flex-col h-full">
          <div className="p-6 pb-2">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-primary" />
                {t('feedback.title')}
              </DialogTitle>
              <DialogDescription>
                {t('feedback.placeholder')}
              </DialogDescription>
            </DialogHeader>
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger value="send" className="text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-2" /> {t('feedback.send')}
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="w-3.5 h-3.5 mr-2" /> {t('feedback.history')} ({myFeedback.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="send" className="flex-1 flex flex-col p-6 pt-2">
            <div className="flex-1 py-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('feedback.placeholder')}
                className="h-full min-h-[250px] resize-none border-border/50 focus-visible:ring-primary/20 bg-background text-foreground"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-border/10">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="w-full bg-gradient-brand text-white shadow-lg shadow-primary/20"
              >
                {isSubmitting ? t('common.saving') : t('feedback.submit')}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
            {loadingHistory && myFeedback.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">{t('feedback.loadingHistory')}</p>
              </div>
            ) : myFeedback.length === 0 ? (
              <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
                <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t('feedback.noFeedback')}</p>
              </div>
            ) : (
              myFeedback.map((item) => (
                <Card key={item.id} className="p-4 border-border/50 shadow-surface space-y-3 bg-card text-card-foreground">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      item.status === 'open' ? "destructive" : 
                      item.status === 'resolved' ? "default" : "secondary"
                    } className="text-[10px] uppercase">
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground italic leading-relaxed">"{item.content}"</p>
                  
                  {item.admin_response && (
                    <div className="mt-3 pt-3 border-t border-border/30 bg-primary/5 -mx-4 -mb-4 p-4">
                      <p className="text-[10px] font-bold text-primary flex items-center gap-1 mb-1 uppercase tracking-wider">
                        <ShieldCheck className="w-3 h-3" /> {t('feedback.adminResponse')}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{item.admin_response}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

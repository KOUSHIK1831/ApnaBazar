-- Enable realtime for feedback so admin dashboards receive new submissions immediately
ALTER publication supabase_realtime ADD TABLE public.feedback;
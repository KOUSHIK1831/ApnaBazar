-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can create feedback
CREATE POLICY "Anyone authenticated can create feedback" ON public.feedback
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins can read/update all feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all feedback" ON public.feedback
FOR UPDATE USING (public.is_admin(auth.uid()));

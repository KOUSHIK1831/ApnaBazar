-- Conversation memory for WhatsApp AI agent
-- Stores message history per phone number so the agent remembers context across messages

CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT NOT NULL,
  store_slug    TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- One active conversation per phone+store pair
CREATE UNIQUE INDEX IF NOT EXISTS conversations_phone_store_idx ON public.conversations (phone, store_slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- No RLS needed — only the service role (edge function) reads/writes this table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

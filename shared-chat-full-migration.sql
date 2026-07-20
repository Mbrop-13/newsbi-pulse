-- Full-chat public sharing support for shared_chat_links
-- Run this in Supabase SQL editor (or via migration pipeline).

ALTER TABLE public.shared_chat_links
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS share_type TEXT DEFAULT 'qa',
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT NULL;

-- Optional index for owner lookups
CREATE INDEX IF NOT EXISTS idx_shared_chat_links_user_id
  ON public.shared_chat_links (user_id);

COMMENT ON COLUMN public.shared_chat_links.share_type IS 'qa = single Q&A pair; full = entire conversation snapshot';
COMMENT ON COLUMN public.shared_chat_links.messages IS 'Snapshot of chat messages when share_type = full';

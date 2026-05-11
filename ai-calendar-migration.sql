-- ═══════════════════════════════════════════════
-- Reclu — AI Calendar Cache Migration
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_ai_calendar (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_ai_calendar ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own AI calendar"
  ON user_ai_calendar FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI calendar"
  ON user_ai_calendar FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI calendar"
  ON user_ai_calendar FOR UPDATE
  USING (auth.uid() = user_id);

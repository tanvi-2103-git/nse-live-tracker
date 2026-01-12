-- Create user_preferences table
CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_mode text DEFAULT 'adaptive',
  theme text DEFAULT 'dark',
  experience_level text DEFAULT 'beginner',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create research_history table
CREATE TABLE public.research_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol text NOT NULL,
  research_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, stock_symbol)
);

-- Enable RLS on research_history
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for research_history
CREATE POLICY "Users can view their own research history"
ON public.research_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own research history"
ON public.research_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own research history"
ON public.research_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own research history"
ON public.research_history FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assistant_type text NOT NULL CHECK (assistant_type IN ('market', 'stock')),
  stock_symbol text,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX idx_chat_messages_user_assistant ON public.chat_messages(user_id, assistant_type);
CREATE INDEX idx_chat_messages_user_stock ON public.chat_messages(user_id, stock_symbol);
CREATE INDEX idx_research_history_user ON public.research_history(user_id);
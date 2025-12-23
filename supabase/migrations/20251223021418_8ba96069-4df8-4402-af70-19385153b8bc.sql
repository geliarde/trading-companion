-- Create table for user watchlist/portfolio
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  average_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);

-- For anonymous users (without login), we'll use a session_id approach
-- But for simplicity, let's also allow storing without user_id (local persistence)
ALTER TABLE public.watchlist ALTER COLUMN user_id DROP NOT NULL;

-- Add a session_id column for anonymous users
ALTER TABLE public.watchlist ADD COLUMN session_id TEXT;

-- Create unique constraint for session-based entries
CREATE UNIQUE INDEX idx_watchlist_session_ticker ON public.watchlist(session_id, ticker) WHERE session_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read their own watchlist (by session_id for anonymous)
CREATE POLICY "Users can view own watchlist" 
ON public.watchlist 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (session_id IS NOT NULL AND user_id IS NULL)
);

-- Policy: Anyone can insert to their watchlist
CREATE POLICY "Users can insert to own watchlist" 
ON public.watchlist 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id IS NULL AND session_id IS NOT NULL)
);

-- Policy: Anyone can update their own watchlist
CREATE POLICY "Users can update own watchlist" 
ON public.watchlist 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (session_id IS NOT NULL AND user_id IS NULL)
);

-- Policy: Anyone can delete from their own watchlist
CREATE POLICY "Users can delete from own watchlist" 
ON public.watchlist 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (session_id IS NOT NULL AND user_id IS NULL)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_watchlist_updated_at
BEFORE UPDATE ON public.watchlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
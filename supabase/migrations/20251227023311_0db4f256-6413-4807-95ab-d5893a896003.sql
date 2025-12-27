-- Add unique constraint for session_id + ticker combination to enable upsert
ALTER TABLE public.watchlist 
ADD CONSTRAINT watchlist_session_ticker_unique 
UNIQUE (session_id, ticker);
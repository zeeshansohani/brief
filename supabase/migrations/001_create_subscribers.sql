-- Run this in Supabase Dashboard → SQL Editor (or via Supabase CLI)
-- Creates the subscribers table for Brief email signups

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

-- Optional: enable RLS and add policy so anon key can insert/select (for subscribe API)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert for signup (your API route uses anon key)
CREATE POLICY "Allow anonymous insert for subscribe"
  ON subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous select only for service role / cron (e.g. send-brief will need to read emails)
-- For anon key: allow select so your API can read when triggered with CRON_SECRET
CREATE POLICY "Allow select for authenticated and service"
  ON subscribers FOR SELECT
  TO anon
  USING (true);

-- Allow update (e.g. unsubscribe) by anon if needed later
CREATE POLICY "Allow update for unsubscribe"
  ON subscribers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

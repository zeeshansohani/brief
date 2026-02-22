import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local"
  );
}

/**
 * Server-side Supabase client for API routes and server components.
 * Use this in app/api/* and server components only.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Subscriber = {
  id: string;
  email: string;
  subscribed_at: string;
  active: boolean;
};

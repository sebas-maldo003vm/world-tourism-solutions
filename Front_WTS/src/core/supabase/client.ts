import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en Front_WTS/.env.',
    );
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}

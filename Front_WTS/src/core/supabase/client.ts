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
    client = createClient(url, anonKey, {
      auth: {
        // El enlace de recuperación llega como hash implícito
        // (#access_token&refresh_token&type=recovery). UpdatePassword lee ese
        // hash y llama a setSession antes de quitarlo. Si detectSessionInUrl
        // queda activo, GoTrue hace window.location.hash = '' al iniciar y
        // deja /update-password# antes de que podamos usar los tokens.
        flowType: 'implicit',
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Provide minimal typing for Vite's import.meta.env to satisfy TypeScript
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL?: string;
    readonly VITE_SUPABASE_ANON_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Vite environment variables (use VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
}

// Create singleton instance to avoid "Multiple GoTrueClient instances" warning
let supabaseInstance: SupabaseClient | null = null;

export const supabase: SupabaseClient | null = (() => {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'sb-fahqtthxiinepqpofzvk-auth-token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  });

  return supabaseInstance;
})();

// Database types for type safety
export interface Session {
  id?: number;
  session_id: string;
  nonce: string;
  title: string;
  date: string;
  created_at?: string;
}

export interface AttendanceRecord {
  id?: number;
  session_id: string;
  wallet_address: string;
  email: string;
  token_id: string;
  tx_hash: string;
  signature: string;
  timestamp?: string;
}
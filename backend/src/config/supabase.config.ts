import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config';

// Client for user-facing operations (respects RLS)
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // We handle session in frontend
    },
  }
);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    return false;
  }
};

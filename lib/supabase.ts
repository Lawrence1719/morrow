import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Quick validation
const isPlaceholder = (val: string) => !val || val.includes('your-') || val.includes('placeholder');

if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey)) {
  console.warn(
    '⚠️ Supabase environment variables are missing or using placeholders. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Client for general public/client-side operations
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Client with service role for admin/server-side operations that bypass RLS
export const supabaseServiceRole = typeof window === 'undefined'
  ? createClient(
      supabaseUrl || 'https://placeholder-project.supabase.co',
      supabaseServiceKey || 'placeholder-service-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )
  : (null as any);

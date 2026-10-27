import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../config/env';
import ws from 'ws';

export const supabaseAdmin: SupabaseClient = createClient(
  environment.SUPABASE_URL,
  environment.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: ws as any
    }
  }
);

export const supabaseClient: SupabaseClient = createClient(
  environment.SUPABASE_URL,
  environment.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    realtime: {
      transport: ws as any
    }
  }
);

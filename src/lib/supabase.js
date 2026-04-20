import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// O cliente é inicializado com placeholders se as chaves estiverem ausentes para não quebrar o build do Next.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

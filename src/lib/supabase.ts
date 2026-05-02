import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// A estrutura já está preparada para conexão com o Supabase.
// Insira as credenciais no arquivo .env (secrets) para habilitar.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

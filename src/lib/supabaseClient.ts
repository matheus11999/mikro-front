import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Renomeado para 'supabasePublic' para clareza.
export const supabasePublic = createClient(supabaseUrl, supabaseKey);

// Alias para compatibilidade: módulos antigos que importam { supabase } continuarão funcionando.
export { supabasePublic as supabase }; 
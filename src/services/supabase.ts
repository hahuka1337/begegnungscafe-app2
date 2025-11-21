import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// KONFIGURATION
// ------------------------------------------------------------------

// Deine Projekt-URL
const supabaseUrl = 'https://ggykltinhljwjmbrxexv.supabase.co';

// Dein Anon Key
const supabaseAnonKey = 'sb_publishable_wd0bJAYqvsor-kwxxElrzA_Saqu_cQP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
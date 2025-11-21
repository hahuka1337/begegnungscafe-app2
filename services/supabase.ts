import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// WICHTIG: HIER DEINE DATEN EINTRAGEN
// 1. Gehe zu supabase.com -> Dein Projekt -> Settings -> API
// 2. Kopiere "Project URL" -> füge sie bei supabaseUrl ein
// 3. Kopiere "anon public" Key -> füge ihn bei supabaseAnonKey ein
// ------------------------------------------------------------------

const supabaseUrl = 'HIER_DEINE_SUPABASE_URL_EINFÜGEN';
const supabaseAnonKey = 'HIER_DEIN_ANON_KEY_EINFÜGEN';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database';

export let supabase: Supabase;


export function setSupabase(supa: Supabase) {
  supabase = supa;
}

export type Supabase = SupabaseClient<Database, 'public'>
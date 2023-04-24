import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database';

export let supabase: Supabase;

export function setSupabase(supa: Supabase) {
    supabase = supa;
}

export async function getSession(supa = supabase) {
    const {
        data: { session }
    } = await supa.auth.getSession();
    if (session === null) throw new Error('No session found');
    return session;
}
export type Supabase = SupabaseClient<Database, 'public'>;

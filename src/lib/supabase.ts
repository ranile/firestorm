import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database';
import { get, writable } from 'svelte/store';

export const supabase = writable<Supabase | null>(null);

export function setSupabase(supa: Supabase) {
    supabase.set(supa);
}

export async function getSession(supa = get(supabase)) {
    if (supa === null) {
        throw new Error('Supabase not initialized');
    }
    const {
        data: { session }
    } = await supa.auth.getSession();
    if (session === null) throw new Error('No session found');
    return session;
}
export type Supabase = SupabaseClient<Database, 'public', Database['public']>;

import type { Database } from '../database';
import { get, writable } from 'svelte/store';
import type { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';

export const supabase = writable<Supabase | null>(null);

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
export type Supabase = ReturnType<typeof createSupabaseLoadClient<Database>>;

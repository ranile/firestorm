import { writable } from 'svelte/store';
import type { Supabase } from '$lib/supabase';

export type View = 'sign-in' | 'sign-up' | 'forgot-password';

export const view = writable<View>('sign-in');

export function signin(supabase: Supabase, email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signup(
    supabase: Supabase,
    username: string,
    email: string,
    password: string
) {
    const auth = await supabase.auth.signUp({ email, password });
    console.log(auth);
    if (auth.data.user === null) {
        return auth;
    }
    await supabase.from('profiles').update({ username }).eq('id', auth.data.user.id);
}

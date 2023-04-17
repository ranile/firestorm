import type { Supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

export async function getUserProfile(supabase: Supabase, session: Session) {
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile.error) {
    throw Error(profile.error?.message ?? profile.error.toString());
  }
  return {
    ...profile.data,
    email: session.user.email,
  }
}

export type Profile = Required<Awaited<ReturnType<typeof getUserProfile>>>

export const profile = writable<Profile | null>(null);

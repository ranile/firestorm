import type { Supabase } from '../supabase';
import type { Session } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

export function getUserProfile(supabase: Supabase, session: Session) {
  return getUserProfileById(supabase, session.user.id);
}
export async function getUserProfileById(supabase: Supabase, userId: string) {
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profile.error) {
    throw Error(profile.error?.message ?? profile.error.toString());
  }
  return profile.data
}

export type Profile = Required<Awaited<ReturnType<typeof getUserProfileById>>>

export const profile = writable<Profile | null>(null);

import type { Profile } from '../../../../lib/db/users';
import { getUserProfileById } from '../../../../lib/db/users';
import type { Supabase } from '../../../../lib/supabase';

const authors: { [key: string]: Profile } = {};

export async function get(supabase: Supabase, id: string): Promise<Profile> {
  const cached = authors[id];
  if (cached) return cached;

  const profile = await getUserProfileById(supabase, id);
  authors[id] = profile;
  return profile;
}
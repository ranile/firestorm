import { env } from '$env/dynamic/public';
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';
import type { LayoutLoad } from './$types';
import type { Database } from '../database';
import { setSupabase } from '$lib/supabase';
import { getUserProfile, profile } from '$lib/db/users';

const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = env

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
    depends('supabase:auth');

    const supabase = createSupabaseLoadClient<Database>({
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
        event: { fetch },
        serverSession: data.session
    });

    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (session !== null) {
        const fetched = await getUserProfile(supabase, session);
        profile.set({ ...fetched, email: data.session?.user.email ?? '' });
    }

    setSupabase(supabase);
    return { supabase, session };
};

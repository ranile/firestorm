import { env } from '$env/dynamic/public';
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';
import type { LayoutLoad } from './$types';
import type { Database } from '../database';
import { setSupabase } from '$lib/supabase';
import { getUserProfile, profile } from '$lib/db/users';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { redirect } from '@sveltejs/kit';
import { subscribeToNotifications } from '$lib/notifications';

const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = env;

async function navigate(where: string) {
    if (browser) {
        await goto(where);
    } else {
        throw redirect(307, where);
    }
}

export const load: LayoutLoad = async ({ fetch, data, url, depends }) => {
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
        const where = fetched.username === null ? '/auth/onboarding' : '/';
        profile.set({ ...fetched, email: data.session?.user.email ?? '' });
        if (url.pathname.startsWith('/auth') && url.pathname !== where) {
            await navigate(where);
        }
    } else {
        if (url.pathname !== '/auth') {
            await navigate('/auth');
        }
    }

    setSupabase(supabase);
    if (browser && session && Notification.permission === 'granted') {
        await subscribeToNotifications(supabase, session);
    }
    return { supabase, session };
};

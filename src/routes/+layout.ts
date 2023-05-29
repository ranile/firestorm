import { env } from '$env/dynamic/public';
import { createSupabaseLoadClient } from '@supabase/auth-helpers-sveltekit';
import type { LayoutLoad } from './$types';
import type { Database } from '../database';
import { supabase as supabaseStore } from '$lib/supabase';
import { getUserProfile, profile } from '$lib/db/users';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { redirect } from '@sveltejs/kit';
import { subscribeToNotifications } from '$lib/notifications';
import { loaded } from '$lib/utils';
import { get } from 'svelte/store';

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
        supabaseUrl: PUBLIC_SUPABASE_URL!,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY!,
        event: { fetch },
        serverSession: data.session
    });

    const {
        data: { session }
    } = await supabase.auth.getSession();

    console.log('loading initial state');
    if (session !== null) {
        let cachedProfile = get(profile);
        if (cachedProfile === null) {
            const fetched = await getUserProfile(supabase, session);
            cachedProfile = { ...fetched, email: data.session?.user.email ?? '' };
            profile.set(cachedProfile);
        }
        const where = cachedProfile.username === null ? '/auth/onboarding' : '/';
        if (url.pathname.startsWith('/auth') && url.pathname !== where) {
            await navigate(where);
        }
    } else {
        if (url.pathname !== '/auth') {
            await navigate('/auth');
        }
    }

    if (get(loaded)) {
        return { supabase, session };
    }

    supabaseStore.set(supabase);
    if (browser && session && Notification.permission === 'granted') {
        await subscribeToNotifications(supabase, session);
    }
    loaded.set(true);
    return { supabase, session };
};

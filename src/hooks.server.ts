import { env } from '$env/dynamic/public';
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit';
import type { Handle } from '@sveltejs/kit';
import { createContext } from '$lib/trpc/context';
import { appRouter } from '$lib/trpc/router';
import { createTRPCHandle } from 'trpc-sveltekit';
import { sequence } from '@sveltejs/kit/hooks';

const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = env;

const supabaseHookHandle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient({
        supabaseUrl: PUBLIC_SUPABASE_URL!,
        supabaseKey: PUBLIC_SUPABASE_ANON_KEY!,
        event
    });

    /**
     * a little helper that is written for convenience so that instead
     * of calling `const { data: { session } } = await supabase.auth.getSession()`
     * you just call this `await getSession()`
     */
    event.locals.getSession = async () => {
        const {
            data: { session }
        } = await event.locals.supabase.auth.getSession();
        return session;
    };

    return resolve(event, {
        /**
         * There´s an issue with `filterSerializedResponseHeaders` not working when using `sequence`
         *
         * https://github.com/sveltejs/kit/issues/8061
         */
        filterSerializedResponseHeaders(name) {
            return name === 'content-range';
        }
    });
};


const trpcHookHandle: Handle = createTRPCHandle({ router: appRouter, createContext });

export const handle = sequence(supabaseHookHandle, trpcHookHandle);
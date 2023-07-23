import type { AppRouter } from '../../../supabase/functions/trpc/index.ts';
import { createTRPCProxyClient as createTRPCClient, httpBatchLink, type CreateTRPCClientOptions } from '@trpc/client';
import { browser } from '$app/environment';
import type { Supabase } from '$lib/supabase.ts';
import type { Session } from '@supabase/supabase-js';

let browserClient: ReturnType<typeof createTRPCClient<AppRouter>>;

interface PageData {
    supabase: Supabase,
    session: Session
}

interface InitOptions extends CreateTRPCClientOptions {
    data: PageData
}

export function trpc(init: InitOptions) {
    if (browser && browserClient) {
        return browserClient;
    }

    const client = createTRPCClient<AppRouter>({
        links: [
            httpBatchLink({
                url: 'http://localhost:54321/functions/v1/trpc',
                // You can pass any HTTP headers you wish here
                async headers() {
                    return {
                        authorization: 'Bearer ' + init.data.session.access_token,
                    };
                },
            }),
        ],
        init,
        url: '/functions/v1/trpc'
    });
    //
    if (browser) {
        browserClient = client;
    }
    return client;
}

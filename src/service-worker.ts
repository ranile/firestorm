/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { createClient } from '@supabase/supabase-js';
import type { Supabase } from './lib/supabase';
import { subscribeToRoomMessages } from './lib/db/messages';

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('message', async (event: ExtendableMessageEvent) => {
    const supabase = createClient(event.data.supabaseUrl, event.data.supabaseKey);
    await supabase.auth.setSession({
        access_token: event.data.accessToken,
        refresh_token: event.data.refreshToken
    });
    await main(supabase);
});

async function checkClientIsVisible() {
    const windowClients = await sw.clients.matchAll();

    for (const windowClient of windowClients) {
        if ((windowClient as WindowClient).visibilityState === "visible") { return true }
    }

    return false;
}

sw.addEventListener('push', (event) => {
    console.log('rooms');
})


const channel = new BroadcastChannel('sw-messages');
async function main(supabase: Supabase) {
    await subscribeToRoomMessages(supabase, 'all_rooms', (event) => {
        if (!checkClientIsVisible()) {
            sw.registration.showNotification('New message')
        }
        channel.postMessage(event)
    });
}
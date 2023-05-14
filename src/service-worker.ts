/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { Database } from './database';

const sw = self as unknown as ServiceWorkerGlobalScope;

interface Notification<T> {
    op: string,
    content: T
}

type Message = Database['public']['Tables']['messages']['Row']

sw.addEventListener('push', (event) => {
    const { op, content } = event.data.json() as Notification<Message>;
    if (op === 'MessageCreate') {
        sw.registration.showNotification(
            `${content.author_id} (${content.room_id})`,
            {
                body: content.content
            }
        );
    }
    console.log('EVENT NOTIFY', notification);
});

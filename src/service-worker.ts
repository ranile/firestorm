/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { Room } from './lib/db/rooms.ts';
import type { Profile } from './lib/db/users.ts';

const sw = self as unknown as ServiceWorkerGlobalScope;

interface Notification<T> {
    op: string,
    content: T
}

interface Message {
    content: string,
    created_at: string,
    room: Room,
    author: Profile
}

sw.addEventListener('push', (event) => {
    const notification = event.data.json() as Notification<Message>;
    if (notification.op === 'MessageCreate') {
        const content = notification.content;
        sw.registration.showNotification(
            `${content.author.username} (${content.room.name})`,
            {
                body: content.content,
                timestamp: Date.parse(content.created_at),
                badge: `${location.origin}/favicon.png`,
                icon: content.author.avatar ?? undefined
            }
        );
    }
    console.log('EVENT NOTIFY', notification);
});

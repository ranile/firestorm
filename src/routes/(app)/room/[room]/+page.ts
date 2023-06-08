import type { PageLoad } from './$types';
import { getMessages } from '$lib/db/messages';
import { rooms } from '$lib/db/rooms';
import { get as getStore } from 'svelte/store';
import { decryptMessage } from './authors';

export const load = (async ({ parent }) => {
    console.time('room load: parent');
    const data = await parent();
    console.timeEnd('room load: parent');
    const room = getStore(rooms)!.find((room) => room.id === data.currentRoomId)!; // this is checked in +layout.ts and will never be undefined

    const encryptedMessages = await getMessages(data.supabase, room.id);
    const messages = Promise.all(
        encryptedMessages.map((message) => decryptMessage(data.supabase, message))
    );
    return {
        room: {
            ...room,
            messages
        }
    };
}) satisfies PageLoad;
export const ssr = false;

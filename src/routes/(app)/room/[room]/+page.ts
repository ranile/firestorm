import type { PageLoad } from './$types';
import { getMessages } from '../../../../lib/db/messages';
import { rooms } from '../../../../lib/db/rooms';
import { get as getStore } from 'svelte/store';

export const load = (async ({ parent }) => {
    const data = await parent();
    const room = getStore(rooms).find((room) => room.id === data.currentRoomId)!; // this is checked in +layout.ts and will never be undefined

    const messages = await getMessages(data.supabase, room.id);
    // todo decrypt message's ciphertext
    return {
        messages,
        room
    }
}) satisfies PageLoad;
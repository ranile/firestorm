import type { PageLoad } from './$types';
import { getRoomById, getRoomMembers } from '$lib/db/rooms';
import { error } from '@sveltejs/kit';

export const load = (async ({ params, parent }) => {
    const data = await parent();
    const room = await getRoomById(data.supabase, params.room);
    if (room === null) {
        console.log(room);
        throw error(404, 'Room not found');
    }
    return {
        room,
        members: await getRoomMembers(data.supabase, room.id)
    };
}) satisfies PageLoad;

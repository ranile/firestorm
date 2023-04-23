import type { PageLoad } from './$types';
import { getRoomById,getRoomMemberForRoom } from '$lib/db/rooms';
import { error } from '@sveltejs/kit';

// TODO: consider not re-fetching data here
export const load = (async ({ params, parent }) => {
    const data = await parent();
    const room = await getRoomById(data.supabase, params.room);
    if (room === null) {
        console.log(room);
        throw error(404, 'Not found');
    }
    const member = await getRoomMemberForRoom(data.supabase, room.id, data.session?.user.id ?? 'always authenticated');
    return {
        room,
        invited: member.join_state === 'invited'
    };
}) satisfies PageLoad;
import type { LayoutLoad } from './$types';
import { getRoomMemberForRoom, getRooms } from '../../lib/db/rooms';
import { splitWith } from '../../lib/utils';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params, parent, depends }) => {
    depends('rooms:load');
    const { supabase, session } = await parent();
    if (session === null) {
        throw redirect(307, '/auth')
    }
    const rooms = await getRooms(supabase);
    const [joined, invited] = await splitWith(rooms ?? [], (room) =>
        getRoomMemberForRoom(supabase, room.id, session.user.id).then((m) => m.join_state === 'joined')
    );
    return {
        currentRoomId: params.room,
        joined,
        invited
    };
}) satisfies LayoutLoad;

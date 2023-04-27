import type { LayoutLoad } from './$types';
import { getRoomsWithMember, rooms } from '$lib/db/rooms';
import { error, redirect } from '@sveltejs/kit';

export const load = (async ({ params, parent, depends }) => {
    depends('rooms:load');
    const { supabase, session } = await parent();
    if (session === null) {
        throw redirect(307, '/auth');
    }
    const roomsWithMember = await getRoomsWithMember(supabase, session.user.id);
    const currentRoom = roomsWithMember.find((room) => room.id === params.room);
    if (currentRoom === undefined) {
        throw error(404, 'room not found');
    }

    rooms.set(roomsWithMember);

    return {
        currentRoomId: params.room
    };
}) satisfies LayoutLoad;

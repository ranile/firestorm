import type { LayoutLoad } from './$types';
import { getRoomsWithMember, rooms } from '$lib/db/rooms';
import { error, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load = (async ({ params, parent, depends }) => {
    depends('rooms:load');
    const { supabase, session } = await parent();
    if (session === null) {
        throw redirect(307, '/auth');
    }
    let roomsWithMember = get(rooms);
    if (roomsWithMember.length === 0) {
        roomsWithMember = await getRoomsWithMember(supabase, session.user.id);
        rooms.set(roomsWithMember);
    }
    if (params.room === undefined) {
        return;
    }
    const currentRoom = roomsWithMember.find((room) => room.id === params.room);
    if (currentRoom === undefined) {
        throw error(404, 'room not found');
    }

    return {
        currentRoomId: params.room
    };
}) satisfies LayoutLoad;

export const ssr = false;

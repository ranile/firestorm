import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load = (async ({ parent }) => {
    const data = await parent();
    const joined = data.joined.find((room) => room.id === data.currentRoomId)
    if (joined) {
        return {
            room: joined,
            invited: false
        }
    }

    const invited = data.invited.find((room) => room.id === data.currentRoomId)
    if (invited) {
        return {
            room: invited,
            invited: true
        }
    }

    throw error(404, 'Room not found');

}) satisfies PageLoad;

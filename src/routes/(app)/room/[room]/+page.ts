import type { PageLoad } from './$types';
import { getRoomById } from '$lib/db/rooms';
import { error } from '@sveltejs/kit';

export const load = (async ({ params, parent  }) => {
	const data = await parent()
	const room = await getRoomById(data.supabase, params.room)
	if (room === null) {
		console.log(room);
		return {
			status: 404,
		}
	}
	return {
		room
	}
}) satisfies PageLoad;
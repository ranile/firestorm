import type { PageLoad } from './$types';
import { getRoomById } from '$lib/db/rooms';
import { error } from '@sveltejs/kit';
import { getMessages } from '../../../../lib/db/messages';

export const load = (async ({ params, parent }) => {
  const data = await parent();
  const room = await getRoomById(data.supabase, params.room);
  if (room === null) {
    console.log(room);
    throw error(404, 'Not found');
  }
  return {
    room,
    messages: await getMessages(data.supabase, params.room),
  };
}) satisfies PageLoad;
import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload, Session } from '@supabase/supabase-js';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { writable } from 'svelte/store';
import { getSession } from '../supabase';

export async function getRooms(supabase: Supabase) {
    const rooms = await supabase.from('rooms').select('*');
    return rooms.data ?? [];
}


export async function getRoomById(supabase: Supabase, id: string) {
    const rooms = await supabase.from('rooms').select('*')
        .eq('id', id)
        .limit(1)
        .order('created_at', { ascending: false })
        .single();
    return rooms.data;
}

export async function createRoom(supabase: Supabase, name: string) {
    const session = await getSession();
    const room = await supabase.from('rooms')
      .insert({ name, created_by: session.user.id })
      .select()
      .single();
    if (room.error) {
        throw room.error;
    }
    // todo session = createRoomSession(); save session.pickle in localstorage
    const member = await supabase.from('room_members')
      .insert({ room_id: room.data.id, member_id: session.user.id  })
      .select()
      .single();

    return { room: room.data, member: member.data }

}

export function subscribeToRoomMembers(supabase: Supabase, callback: (rooms: RealtimePostgresChangesPayload<UnionFromValues<Database['public']['Tables']['room_members']>>) => void, uid: string) {
    return supabase.channel('table-db-changes')
        .on(REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
            {
                event: '*',
                schema: 'public',
                table: 'room_members',
                filter: `member_id=eq.${uid}`,
            },
          callback
        )
        .subscribe();
}

export type Room = Required<Awaited<ReturnType<typeof getRoomById>>>
export const rooms = writable<Room[]>([]);

import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload, Session } from '@supabase/supabase-js';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { writable } from 'svelte/store';
import { getSession } from '../supabase';
import { OutboundSession } from 'moe';
import { browser } from '$app/environment';

export async function getRooms(supabase: Supabase) {
    const rooms = await supabase.from('rooms').select('*');
    return rooms.data ?? [];
}

export function initRoomEncryption() {
  if (!browser) { return }
  const outboundSession = new OutboundSession();
  const arr = new Uint8Array(32).map(() => 1);
  const pickle = outboundSession.pickle(arr);
  return { pickle, sessionKey: outboundSession.session_key() }
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

    const sess = initRoomEncryption();
    if (sess === undefined) {
      throw Error('executed on server environment')
    }
    localStorage.setItem(`${room.data.id}:pickle`, sess.pickle);
    const member = await supabase.from('room_members')
      .insert({ room_id: room.data.id, member_id: session.user.id, session_key: sess.sessionKey })
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

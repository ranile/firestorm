import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';

export async function getRooms(supabase: Supabase) {
    const rooms = await supabase.from('rooms').select('*');
    return rooms.data ?? [];
}


export async function getRoomById(supabase: Supabase, id: string) {
    const rooms = await supabase.from('rooms').select('*')
        .eq('id', id)
        .limit(1)
        .single();
    return rooms.data;
}

export function subscrieToRoomMembers(supabase: Supabase, callback: (rooms: RealtimePostgresChangesPayload<UnionFromValues<Database['public']['Tables']['room_members']>>) => void, uid: string) {
    return supabase.channel('table-db-changes')
        .on(REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
            {
                event: '*',
                schema: 'public',
                table: 'room_members',
                filter: `member_id=eq.${uid}`
            },
            callback
        )
        .subscribe();
}

export type Room = Required<Awaited<ReturnType<typeof getRoomById>>>
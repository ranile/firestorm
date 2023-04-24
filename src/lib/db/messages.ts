import type { Supabase } from '../supabase';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';

export async function getMessages(supabase: Supabase, roomId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(69);

    if (error !== null) {
        throw error;
    }

    return data;
}

export async function subscribeToRoomMessages(
    supabase: Supabase,
    roomId: string,
    callback: (
        messages: RealtimePostgresChangesPayload<
            UnionFromValues<Database['public']['Tables']['messages']>
        >
    ) => void
) {
    return supabase
        .channel(`${roomId}-messages`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            },
            callback
        )
        .subscribe();
}
export async function createMessage(
    supabase: Supabase,
    roomId: string,
    userId: string,
    content: string
) {
    const { error } = await supabase
        .from('messages')
        .insert({ room_id: roomId, author_id: userId, content });

    if (error !== null) {
        throw error;
    }
}

export type Message = Database['public']['Tables']['messages']['Row'];

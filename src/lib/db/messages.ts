import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { Unreachable } from '../utils';
import type { Profile } from '$lib/db/users';

export async function getMessages(supabase: Supabase, roomId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select('created_at, content, room_id, id, users_with_profiles(id, username, avatar)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(69);

    if (error !== null) {
        console.error(error);
        throw error;
    }

    return (
        data?.map((message) => {
            const author = message.users_with_profiles;
            if (author === null || Array.isArray(author)) {
                throw new Unreachable('author of message is null');
            }
            return {
                room_id: message.room_id,
                content: message.content,
                created_at: message.created_at,
                id: message.id,
                author: {
                    id: author.id!,
                    username: author.username!,
                    avatar: author.avatar!
                }
            } satisfies AuthoredMessage;
        }) ?? []
    );
}

export function subscribeToRoomMessages(
    supabase: Supabase,
    roomId: string,
    callback: (
        messages: RealtimePostgresChangesPayload<
            UnionFromValues<Database['public']['Tables']['messages']>
        >
    ) => void
) {
    console.log('room id', roomId);
    return supabase
        .channel(`${roomId}-messages`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
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
export type AuthoredMessage = Omit<Message, 'author_id'> & { author: Profile };

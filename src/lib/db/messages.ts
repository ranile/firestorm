import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database, Json as PgJson } from '../../database';
import type { UnionFromValues } from '../utils';
import { Unreachable } from '../utils';
import type { Profile } from '$lib/db/users';
import type { EncryptedFile, OutboundSession } from 'moe';
import { ulid } from 'ulidx';

export async function getMessages(supabase: Supabase, roomId: string) {
    const { data, error } = await supabase
        .from('messages')
        .select(
            'created_at, content, room_id, id, users_with_profiles(id, username, avatar), attachments_and_objects(*)'
        )
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(69);

    if (error !== null) {
        console.error(error);
        throw error;
    }

    return (
        data?.reverse()?.map((message) => {
            const author = message.users_with_profiles;
            if (author === null || Array.isArray(author)) {
                throw new Unreachable('author of message is null');
            }
            let attachments = message.attachments_and_objects ?? [];
            if (!Array.isArray(attachments)) {
                attachments = [attachments];
            }
            return {
                room_id: message.room_id,
                content: message.content,
                created_at: message.created_at,
                id: message.id,
                attachments,
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
    outboundSession: OutboundSession,
    roomId: string,
    userId: string,
    ciphertext: string,
    attachments: EncryptedFile[]
) {
    interface Attachment {
        path: string;
        name: string;
        type: string;
        key_ciphertext: string;
        hashes: Record<string, string>;
    }

    const files: Attachment[] = [];
    for (const file of attachments) {
        const id = ulid();
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(`attachments/${id}`, file.bytes, {
                contentType: file.type
            });

        if (error !== null) {
            console.error(error);
            continue;
        }

        const keyCiphertext = outboundSession.encrypt(JSON.stringify(file.key));
        files.push({
            path: data.path,
            name: file.name,
            // @ts-expect-error type_ is a valid property, wasm bindgen doesn't like to expose `type`
            type: file.type_,
            key_ciphertext: keyCiphertext,
            hashes: file.key.hashes
        } satisfies Attachment);
    }

    console.log(files);

    const { error } = await supabase.rpc('insert_message', {
        p_uid: userId,
        p_files: files as unknown as PgJson,
        p_room_id: roomId,
        p_ciphertext: ciphertext
    });

    if (error !== null) {
        throw error;
    }
}

export type Attachment = Required<Database['public']['Views']['attachments_and_objects']['Row']>;
export type Message = Database['public']['Tables']['messages']['Row'] & {
    attachments: Attachment[];
};
export type AuthoredMessage = Omit<Message, 'author_id'> & { author: Profile };

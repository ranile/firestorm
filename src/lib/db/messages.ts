import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database, Json as PgJson } from '../../database';
import type { UnionFromValues } from '../utils';
import { Unreachable } from '../utils';
import type { Profile } from '$lib/db/users';
import type { EncryptedFile, OutboundSession } from 'moe';
import { ulid } from 'ulidx';

export async function getMessages(supabase: Supabase, roomId: string | undefined, limit = 69, messageId?: string) {
    let query = supabase
        .from('messages')
        .select(
            'created_at, content, room_id, reply_to, id, users_with_profiles(id, username, avatar), attachments_and_objects(*)'
        )
        .eq('deleted', false);

    if (roomId) {
        query = query.eq('room_id', roomId);
    }

    if (messageId) {
        query = query.eq('id', messageId);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

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
                reply_to: message.reply_to,
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

export async function getAttachmentsForMessage(supabase: Supabase, messageId: string) {
    const { data, error } = await supabase
        .from('attachments_and_objects')
        .select('*')
        .eq('message_id', messageId);

    if (error) {
        console.error(error);
        throw error;
    }

    return data ?? [];
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
                event: '*',
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
    replyTo: string | null,
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
        const bytes = new Uint8Array(file.bytes);
        const { data, error } = await supabase.storage
            .from('attachments')
            .upload(`attachments/${id}`, bytes, {
                contentType: 'application/octet-stream'
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

    const { error } = await supabase.rpc('insert_message', {
        p_uid: userId,
        p_files: files as unknown as PgJson,
        p_room_id: roomId,
        p_ciphertext: ciphertext,
        p_reply_to: replyTo
    });

    if (error !== null) {
        throw error;
    }
}

export async function deleteMessage(supabase: Supabase, messageId: string) {
    const { error } = await supabase.from('messages').update({ deleted: true }).eq('id', messageId);
    if (error) {
        throw error;
    }
}

type AttachmentInner = Required<Database['public']['Views']['attachments_and_objects']['Row']>;
export type Attachment = AttachmentInner & { key?: AttachmentInner['key_ciphertext'] };
export type Message = Database['public']['Tables']['messages']['Row'] & {
    attachments: Attachment[];
};
export type AuthoredMessage = Omit<Message, 'author_id' | 'attachments' | 'deleted'> & {
    author: Profile,
    attachments?: Attachment[],
    deleted?: boolean,
};

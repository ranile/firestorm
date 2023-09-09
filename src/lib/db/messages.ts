import type { Supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { Unreachable } from '../utils';
import type { Profile } from '$lib/db/users';
import type { EncryptedFile, OutboundSession } from 'moe';
import type { CreateMessage as CreateMessagePayload } from '$lib/trpc/routes/messages';
import type { Page } from '@sveltejs/kit';
import { trpc } from '$lib/trpc/client';

export async function getMessages(
    supabase: Supabase,
    roomId: string | undefined,
    limit = 69,
    messageId?: string
) {
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

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

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
            UnionFromValues<
                Pick<Database['public']['Tables']['messages'], 'Insert' | 'Update' | 'Row'>
            >
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
    page: Page,
    roomId: string,
    userId: string,
    ciphertext: string,
    replyTo: string | null,
    attachments: EncryptedFile[]
) {
    // const files = attachments.map((file) => {
    //     const keyCiphertext = outboundSession.encrypt(JSON.stringify(file.key));
    //     return {
    //         bytes: [...file.bytes],
    //         name: file.name,
    //         // @ts-expect-error type_ is a valid property, wasm bindgen doesn't like to expose `type`
    //         type: file.type_,
    //         key_ciphertext: keyCiphertext,
    //         hashes: file.key.hashes
    //     };
    // }) satisfies CreateMessagePayload['files'];

    return trpc(page).messages.createMessage.mutate({
        roomId,
        uid: userId,
        ciphertext,
        replyTo,
        files: []
    });
}

export async function updateMessage(
    supabase: Supabase,
    messageId: string,
    patch: Database['public']['Tables']['messages']['Update']
) {
    const { error } = await supabase.from('messages').update(patch).eq('id', messageId);
    if (error) {
        throw error;
    }
}

export function deleteMessage(supabase: Supabase, messageId: string) {
    return updateMessage(supabase, messageId, { deleted: true });
}

type AttachmentInner = Required<Database['public']['Views']['attachments_and_objects']['Row']>;
export type Attachment = AttachmentInner & { key?: AttachmentInner['key_ciphertext'] };
export type Message = Database['public']['Tables']['messages']['Row'] & {
    attachments: Attachment[];
};
export type AuthoredMessage = Omit<Message, 'author_id' | 'attachments' | 'deleted'> & {
    author: Profile;
    attachments?: Attachment[];
    deleted?: boolean;
};

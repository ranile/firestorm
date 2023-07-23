import type { Profile } from '$lib/db/users';
import { getUserProfileById } from '$lib/db/users';
import type { Supabase } from '$lib/supabase';
import { getSession } from '$lib/supabase';
import { InboundSession, OutboundSession } from 'moe';
import type { AuthoredMessage } from '$lib/db/messages';
import { buildOutboundSession, getDecryptedSessionKey } from '$lib/e2ee';

const authors: { [key: string]: Profile } = {};

// map containing room id as key and map of author_id to InboundSession as value
const sessionKeys: Record<string, InboundSession> = {};

export async function get(supabase: Supabase, id: string): Promise<Profile> {
    const cached = authors[id];
    if (cached) return cached;

    console.info('cache miss for author; fetching from supabase', id);
    const profile = await getUserProfileById(supabase, id);
    authors[id] = profile;
    return profile;
}

async function getInboundSessionViaOlmSessionKey(
    supabase: Supabase,
    selfId: string,
    authorId: string,
    roomId: string
) {
    const sessionKey = await getDecryptedSessionKey(supabase, selfId, authorId, roomId);
    if (sessionKey === null) {
        // this is the case where they haven't given us a key
        // they should give us a key when inviting(/adding?) us to a room,
        // but we should also be able to request a key from them
        await supabase.from('room_session_key_request').insert({
            room_id: roomId,
            requested_by: selfId,
            requested_from: authorId
        });
        return null;
    }
    localStorage.setItem(`${roomId}:${authorId}:sessionKey`, sessionKey);
    // sessionKeys[`${roomId}:${authorId}`] = inbound;
    return new InboundSession(sessionKey);
}

async function getInboundSession(supabase: Supabase, roomId: string, authorId: string) {
    const session = await getSession(supabase);

    const sessionKeyFromLocalStorage = localStorage.getItem(`${roomId}:${authorId}:sessionKey`);
    return sessionKeyFromLocalStorage
        ? new InboundSession(sessionKeyFromLocalStorage)
        : await getInboundSessionViaOlmSessionKey(supabase, session.user.id, authorId, roomId);
}

export async function decryptAttachment(
    supabase: Supabase,
    roomId: string,
    authorId: string,
    ciphertext: string
) {
    const sess = await getInboundSession(supabase, roomId, authorId);
    if (sess === null) {
        return null;
    }
    return JSON.parse(sess.decrypt(ciphertext));
}
export async function decryptMessage(supabase: Supabase, message: AuthoredMessage) {
    const { content, author, room_id: roomId } = message;
    const sess = await getInboundSession(supabase, roomId, author.id);
    if (sess === null) {
        return {
            ...message,
            content:
                'This message could not be decrypted because this person has not yet shared their keys with you. You will receive the keys next time they come online.',
            attachments: []
        };
    }
    const plaintext = sess.decrypt(content);
    const attachments = message.attachments?.map((it) => {
        const key = JSON.parse(sess.decrypt(it.key_ciphertext!));
        console.log('dec', key);
        return {
            ...it,
            key
        };
    });
    return {
        ...message,
        content: plaintext,
        attachments
    } satisfies AuthoredMessage;
}

let outbound: OutboundSession | undefined;

export function getOutboundSession(roomId: string) {
    if (outbound) return outbound;
    const newOutbound = buildOutboundSession(roomId);
    if (newOutbound) {
        outbound = newOutbound;
    }
    return outbound;
}

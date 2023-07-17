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

async function getInboundSessionViaOlmSessionKey(supabase: Supabase, selfId: string, authorId: string, roomId: string) {
    const sessionKey = await getDecryptedSessionKey(supabase, selfId, authorId, roomId);
    if (sessionKey === null) {
        return null;
    }
    localStorage.setItem(`${roomId}:${authorId}:sessionKey`, sessionKey);
    // sessionKeys[`${roomId}:${authorId}`] = inbound;
    return new InboundSession(sessionKey);
}

export async function decryptMessage(supabase: Supabase, message: AuthoredMessage) {
    const { content, author, room_id: roomId } = message;
    const session = await getSession(supabase);
    const sessionKeyFromLocalStorage = localStorage.getItem(`${roomId}:${author.id}:sessionKey`);
    const sess = sessionKeyFromLocalStorage
        ? new InboundSession(sessionKeyFromLocalStorage)
        : await getInboundSessionViaOlmSessionKey(supabase, session.user.id, author.id, roomId);
    if (sess === null) {
        return {
            ...message,
            content: 'This message could not be decrypted because you have not yet shared a key with this person.',
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
    const newOutbound = buildOutboundSession(roomId)
    if (newOutbound) {
        outbound = newOutbound
    }
    return outbound
}

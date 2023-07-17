import type { Profile } from '$lib/db/users';
import { getUserProfileById } from '$lib/db/users';
import type { Supabase } from '$lib/supabase';
import { getSession } from '$lib/supabase';
import { decryptRoomSessionKey, InboundSession, OutboundSession } from 'moe';
import type { AuthoredMessage } from '$lib/db/messages';
import { olmAccount, raise } from '$lib/utils';
import { get as getStore } from 'svelte/store';
import { buildOutboundSession } from '$lib/e2ee';

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
    const { data: sessKey, error: sessKeyErr } = await supabase
        .from('room_session_keys')
        .select('*')
        .eq('room_id', roomId)
        .eq('key_of', authorId)
        .eq('key_for', selfId)
        .maybeSingle();
    if (sessKeyErr) {
        throw sessKeyErr;
    }
    if (sessKey === null) {
        // TODO: this is the case where they haven't given us a key
        // they should give us a key when inviting(/adding?) us to a room
        return null
    }

    const { data, error: idKeyErr } = await supabase
        .from('user_identity_keys')
        .select('curve25519')
        .eq('id', authorId)
        .single();

    if (idKeyErr) {
        throw idKeyErr;
    }

    const ciphertext = sessKey.key!;
    const encryptorIdentityKey = data.curve25519;
    const userAccount = getStore(olmAccount) ?? raise('olm account not initialized');
    const sessionKey = decryptRoomSessionKey(userAccount, encryptorIdentityKey, ciphertext);
    localStorage.setItem(`${roomId}:${authorId}:sessionKey`, sessionKey);
    // sessionKeys[`${roomId}:${authorId}`] = inbound;
    return new InboundSession(sessionKey);
}

export async function getInboundSession(supabase: Supabase, authorId: string, roomId: string) {
    const cached = sessionKeys[`${roomId}:${authorId}`];
    if (cached) return cached;

    console.info('cache miss for inbound session; fetching from supabase', authorId, roomId);
    const key = await supabase
        .from('room_members')
        .select('*')
        .eq('member_id', authorId)
        .eq('room_id', roomId)
        .limit(1)
        .single();

    if (key.error) {
        throw key.error;
    }

    const sessionKey = key.data.session_key;
    if (sessionKey === null) {
        throw Error('attempted to get inbound session for a room without end-to-end encryption');
    }

    sessionKeys[`${roomId}:${authorId}`] = new InboundSession(sessionKey);
    return sessionKeys[`${roomId}:${authorId}`];
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

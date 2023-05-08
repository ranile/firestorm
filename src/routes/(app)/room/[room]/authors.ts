import type { Profile } from '$lib/db/users';
import { getUserProfileById } from '$lib/db/users';
import type { Supabase } from '$lib/supabase';
import { InboundSession } from 'moe';
import type { AuthoredMessage } from '$lib/db/messages';

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
    const sess = await getInboundSession(supabase, author.id, roomId);
    const plaintext = sess.decrypt(content);
    return {
        ...message,
        content: plaintext
    } satisfies AuthoredMessage;
}

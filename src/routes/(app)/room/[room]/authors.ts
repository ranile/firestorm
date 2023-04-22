import type { Profile } from '../../../../lib/db/users';
import { getUserProfileById } from '../../../../lib/db/users';
import type { Supabase } from '../../../../lib/supabase';
import { InboundSession } from '../../../../../../e2ee/moe/pkg';

const authors: { [key: string]: Profile } = {};

// map containing room id as key and map of author_id to InboundSession as value
const sessionKeys: Record<string, Record<string, InboundSession>> = {};

export async function get(supabase: Supabase, id: string): Promise<Profile> {
    const cached = authors[id];
    if (cached) return cached;

    const profile = await getUserProfileById(supabase, id);
    authors[id] = profile;
    return profile;
}

export async function getInboundSession(supabase: Supabase, authorId: string, roomId: string) {
    if (sessionKeys[roomId] === undefined) {
        sessionKeys[roomId] = {}
    }

    const cached = sessionKeys[roomId][authorId]
    if (cached) return cached
    const key = await supabase.from('room_members')
        .select('*')
        .eq('member_id', authorId)
        .eq('room_id', roomId)
        .limit(1)
        .single()

    if (key.error) {
        throw key.error;
    }

    const sessionKey = key.data.session_key
    if (sessionKey === null) {
        throw Error('attempted to get inbound session for a room without end-to-end encryption')
    }

    sessionKeys[roomId][authorId] = new InboundSession(sessionKey)
    return sessionKeys[roomId][authorId]
}
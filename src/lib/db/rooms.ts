import type { Supabase } from '../supabase';
import { getSession, supabase } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { get, writable } from 'svelte/store';
import { encryptRoomSessionKey, OutboundSession, UserAccount } from 'moe';

export async function getRoomsWithMember(supabase: Supabase, memberId: string) {
    const rooms = await supabase
        .from('rooms')
        .select(`*, room_members(joined_at, join_state)`)
        .eq('room_members.member_id', memberId);

    if (rooms.error) {
        throw rooms.error;
    }

    return rooms.data.map((room) => {
        if (room.room_members === null) {
            throw new Error('there must be at least one room member');
        }
        const member = Array.isArray(room.room_members) ? room.room_members[0] : room.room_members;
        return {
            ...room,
            membership: {
                ...member
            }
        };
    });
}

export function initRoomEncryption() {
    const outboundSession = new OutboundSession();
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    const pickle = outboundSession.pickle(arr);
    return { pickle: { ciphertext: pickle, key: arr }, sessionKey: outboundSession.session_key() };
}

export async function getRoomById(supabase: Supabase, id: string) {
    const rooms = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .limit(1)
        .order('created_at', { ascending: false })
        .single();
    if (rooms.error) {
        throw rooms.error;
    }
    return rooms.data;
}

export async function getRoomMembers(supabase: Supabase, roomId: string) {
    const members = await supabase
        .from('room_members_with_users')
        .select('*')
        .eq('room_id', roomId);
    if (members.error) {
        throw members.error;
    }
    return members.data;
}

function storePickleInLocalStorage(roomId: string, sess: ReturnType<typeof initRoomEncryption>) {
    localStorage.setItem(
        `${roomId}:pickle`,
        JSON.stringify({
            ciphertext: sess.pickle.ciphertext,
            key: Array.from(sess.pickle.key)
        })
    );
}

export async function createRoom(supabase: Supabase, userAccount: UserAccount, name: string) {
    const session = await getSession();
    const { data: room, error } = await supabase
        .from('rooms')
        .insert({ name, created_by: session.user.id })
        .select()
        .single();
    if (error) {
        throw error;
    }
    const member = await joinRoom(supabase, userAccount, room.id)

    return { room: room, member: member };
}

export function subscribeToRoomMembers(
    supabase: Supabase,
    callback: (
        rooms: RealtimePostgresChangesPayload<
            UnionFromValues<Database['public']['Tables']['room_members']>
        >
    ) => void,
    uid: string
) {
    return supabase
        .channel('table-db-changes')
        .on(
            REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
            {
                event: '*',
                schema: 'public',
                table: 'room_members',
                filter: `member_id=eq.${uid}`
            },
            callback
        )
        .subscribe();
}

export async function inviteMember(supabase: Supabase, roomId: string, userId: string) {
    const { data, error } = await supabase
        .from('room_members')
        .insert({
            room_id: roomId,
            member_id: userId
        })
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

export async function getRoomMemberForRoom(supabase: Supabase, roomId: string, userId: string) {
    const member = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('member_id', userId)
        .single();
    if (member.error) {
        throw member.error;
    }

    return member.data;
}

export async function joinRoom(supabase: Supabase, userAccount: UserAccount, roomId: string) {
    const session = await getSession(supabase);
    const sess = initRoomEncryption();
    if (sess === undefined) {
        throw Error('executed on server environment');
    }

    const { data: memberKeys, error } = await supabase.rpc('get_keys_for_members', {
        _room_id: roomId
    });

    if (error) {
        throw error;
    }

    const selfMember = async () => {
        const { data, error } = await supabase.rpc('get_one_time_key', { uid: session.user.id })
        if (error) {
            throw error;
        }
        return {
            identity_key_curve25519: userAccount.identityKeys().curve25519,
            one_time_key_curve25519: data.curve25519,
            member_id: session.user.id
        }
    }

    const keys = memberKeys.length !== 0 ? memberKeys : [await selfMember()]
    console.log('keys', keys);

    const members = keys.map(({ identity_key_curve25519, one_time_key_curve25519, member_id }) => ({
        user_id: member_id,
        identity_key: identity_key_curve25519,
        one_time_key: one_time_key_curve25519,
    }))
    console.log('members', members);
    const sessionKey = sess.sessionKey
    console.log('members', members);

    type RoomSessionKey = Database['public']['Tables']['room_session_keys']['Insert'];
    const sessionKeysForMembers = encryptRoomSessionKey(userAccount, sessionKey, members)
    const rowsToInsert: RoomSessionKey[] = []
    for (const [memberId, sessionKey] of sessionKeysForMembers) {
        rowsToInsert.push({ room_id: roomId, key_of: session.user.id, key_for: memberId, key: sessionKey } satisfies RoomSessionKey)
    }

    const sessKeysIns = await supabase.from('room_session_keys').insert(rowsToInsert)
    if (sessKeysIns.error) {
        throw sessKeysIns.error;
    }

    const member = await supabase
        .from('room_members')
        .upsert({ room_id: roomId, member_id: session.user.id, session_key: null, join_state: 'joined' })
        .match({ room_id: roomId, member_id: session.user.id })
        .select()
        .single();
    storePickleInLocalStorage(roomId, sess);

    return member.data;
}

export type Room = Database['public']['Tables']['rooms']['Row'];
interface Membership {
    joined_at: string;
    join_state: 'joined' | 'invited';
}

export const rooms = writable<(Room & { membership: Membership })[]>([]);

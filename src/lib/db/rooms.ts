import type { Supabase } from '../supabase';
import { getSession } from '../supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { REALTIME_LISTEN_TYPES } from '@supabase/realtime-js/src/RealtimeChannel';
import type { Database } from '../../database';
import type { UnionFromValues } from '../utils';
import { writable } from 'svelte/store';
import { OutboundSession } from 'moe';

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
    const arr = new Uint8Array(32).map(() => 1);
    const pickle = outboundSession.pickle(arr);
    return { pickle, sessionKey: outboundSession.session_key() };
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

export async function createRoom(supabase: Supabase, name: string) {
    const session = await getSession();
    const room = await supabase
        .from('rooms')
        .insert({ name, created_by: session.user.id })
        .select()
        .single();
    if (room.error) {
        throw room.error;
    }

    const sess = initRoomEncryption();
    if (sess === undefined) {
        throw Error('executed on server environment');
    }
    localStorage.setItem(`${room.data.id}:pickle`, sess.pickle);
    const member = await supabase
        .from('room_members')
        .insert({
            room_id: room.data.id,
            member_id: session.user.id,
            session_key: sess.sessionKey,
            join_state: 'joined'
        })
        .select()
        .single();

    return { room: room.data, member: member.data };
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

export async function joinRoom(supabase: Supabase, roomId: string) {
    const session = await getSession(supabase);
    const sess = initRoomEncryption();
    if (sess === undefined) {
        throw Error('executed on server environment');
    }
    const member = await supabase
        .from('room_members')
        .update({ session_key: sess.sessionKey, join_state: 'joined' })
        .match({ room_id: roomId, member_id: session.user.id })
        .select()
        .single();
    localStorage.setItem(`${roomId}:pickle`, sess.pickle);

    return member.data;
}

export type Room = Database['public']['Tables']['rooms']['Row'];
interface Membership {
    joined_at: string;
    join_state: 'joined' | 'invited';
}

export const rooms = writable<(Room & { membership: Membership })[]>([]);

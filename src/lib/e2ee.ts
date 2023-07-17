import { decryptRoomSessionKey, OutboundSession } from 'moe';
import type { Supabase } from '$lib/supabase';
import { get as getStore } from 'svelte/store';
import { olmAccount, raise } from '$lib/utils';

export function buildOutboundSession(roomId: string) {
    const storedPickle = localStorage.getItem(`${roomId}:pickle`);
    if (!storedPickle) {
        return null;
    }
    const parsedPickle = JSON.parse(storedPickle);
    const key = new Uint8Array(parsedPickle.key);
    return OutboundSession.from_pickle(parsedPickle.ciphertext, key);
}

export async function getDecryptedSessionKey(
    supabase: Supabase,
    selfId: string,
    authorId: string,
    roomId: string
) {
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
        return null;
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
    return decryptRoomSessionKey(userAccount, encryptorIdentityKey, ciphertext);
}
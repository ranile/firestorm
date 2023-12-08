import { getSession, type Supabase } from '$lib/supabase';

export async function getKeyRequests(supabase: Supabase) {
    const session = await getSession(supabase);
    const requests = await supabase
        .from('room_session_key_requests')
        .select('*')
        .eq('requested_from', session.user.id);

    if (requests.error) {
        throw requests.error;
    }
    return requests.data;
}

export async function getSharedKeys(supabase: Supabase, deviceId: string) {
    const session = await getSession(supabase);
    const keys = await supabase
        .from('room_session_keys')
        .select('*')
        .eq('key_for_device', deviceId)
        .eq('key_for_user', session.user.id);
    if (keys.error) {
        throw keys.error;
    }
    return keys.data;
}
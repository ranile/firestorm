import { EncryptedMessage, Machine, Api as API } from 'moe';
import { supabase } from '$lib/supabase';
import { get } from 'svelte/store';
import { trpc } from '$lib/trpc/client';
import { page } from '$app/stores';
// init()

let machine: Machine;
export function init(user_id: string, device_id: string) {
    const getDevicesForUser = async (userId: string) => {
        return await trpc(get(page)).users.getDevicesForUser.query(userId);
    }
    const getOneTimeKeys = async (userId: string, deviceId: string) => {
        return await trpc(get(page)).users.getOneTimeKey.query({ userId, deviceId });
    }
    const api = new API(getDevicesForUser, getOneTimeKeys);
    machine = new Machine(user_id, device_id, api);
    return machine;
}

export { machine }

const encoder = new TextEncoder();
const decoder = new TextDecoder()

export function encrypt(roomId: string, plaintext: string) {
    const bytes = encoder.encode(plaintext);
    const encrypted =  machine.encrypt(roomId, bytes);
    if (encrypted === undefined) { return undefined}
    return JSON.stringify({
        megolm: encrypted.megolm,
        session_id: encrypted.sessionId
    })
}

export function decrypt(roomId: string, text: string) {
    const message = JSON.parse(text);
    const bytes = machine.decrypt(roomId, new EncryptedMessage(message.megolm, message.session_id));
    if (bytes === null) {
        return null;
    }
    return decoder.decode(bytes);
}

export function getOneTimeKeys(count: number) {
    return machine.getOneTimeKeys(count);
}

export function markOneTimeKeysAsPublished() {
    machine.markOneTimeKeysAsPublished();
}
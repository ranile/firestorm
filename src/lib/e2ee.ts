import { EncryptedMessage, Machine, Api as API } from 'moe';

let machine: Machine;
export function init(user_id: string, device_id: string) {
    const getDevicesForUser = async (userId: string) => {
        return await fetch(`/api/users/devices?userId=${userId}`).then(it => it.json());
    }
    const getOneTimeKeys = async (userId: string, deviceId: string) => {
        return await fetch(`/api/users/otk?userId=${userId}&deviceId=${deviceId}`).then(it => it.json()).then(it => it.key);
    }
    const api = new API(getDevicesForUser, getOneTimeKeys);
    machine = new Machine(user_id, device_id, api);
    return machine;
}

export { machine }

const encoder = new TextEncoder();
const decoder = new TextDecoder()

export async function encrypt(roomId: string, plaintext: string) {
    const bytes = encoder.encode(plaintext);
    const encrypted =  await machine.encrypt(roomId, bytes);
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

export function shareRoomKey(roomId: string, userId: string[]): Promise<Record<string, Record<string, unknown>>> {
    return machine.shareRoomKey(roomId, userId);
}

export function getOneTimeKeys(count: number) {
    return machine.getOneTimeKeys(count);
}

export function markOneTimeKeysAsPublished() {
    machine.markOneTimeKeysAsPublished();
}
import { EncryptedMessage, Machine } from 'moe';
// init()

export const machine = new Machine('user_id', 'device_id');
const encoder = new TextEncoder();
const decoder = new TextDecoder()

export function encrypt(roomId: string, plaintext: string) {
    const bytes = encoder.encode(plaintext);
    return machine.encrypt(roomId, bytes);
}

export function decrypt(roomId: string, message: EncryptedMessage) {
    const bytes = machine.decrypt(roomId, message);
    return decoder.decode(bytes);
}
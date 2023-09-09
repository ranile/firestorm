import { EncryptedMessage, Machine } from 'moe';
// init()

let machine: Machine;
export function init(user_id: string, device_id: string) {
    machine = new Machine(user_id, device_id);
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
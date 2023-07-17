import { OutboundSession } from 'moe';

export function buildOutboundSession(roomId: string) {
    const storedPickle = localStorage.getItem(`${roomId}:pickle`);
    if (!storedPickle) {
        return null;
    }
    const parsedPickle = JSON.parse(storedPickle);
    const key = new Uint8Array(parsedPickle.key);
    return OutboundSession.from_pickle(parsedPickle.ciphertext, key);
}

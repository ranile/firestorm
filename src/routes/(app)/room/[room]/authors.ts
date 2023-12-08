import { getSession, type Supabase } from '$lib/supabase';
import type { AuthoredMessage } from '$lib/db/messages';
import { decrypt } from '$lib/e2ee';
import { requestKeys } from '$lib/db/rooms';

const NO_KEYS_MESSAGE = 'This message could not be decrypted because this person has not yet shared their keys with you. You will receive the keys next time they come online.';

export async function decryptMessage(supabase: Supabase, message: AuthoredMessage) {
    const { content, room_id: roomId } = message;
    const plaintext = decrypt(roomId, content);
    if (plaintext === null) {
        await requestKeys(supabase, await getSession(supabase), roomId, [message.author.id]);
        console.log(`decrypt failed: need to request keys of ${message.author.id} in ${message.room_id}`);
    }
    return {
        ...message,
        content: plaintext ?? NO_KEYS_MESSAGE,
    } satisfies AuthoredMessage;
}


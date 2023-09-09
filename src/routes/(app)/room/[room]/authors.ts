import type { Supabase } from '$lib/supabase';
import type { AuthoredMessage } from '$lib/db/messages';
import { decrypt } from '$lib/e2ee';

const NO_KEYS_MESSAGE = 'This message could not be decrypted because this person has not yet shared their keys with you. You will receive the keys next time they come online.';

export async function decryptMessage(supabase: Supabase, message: AuthoredMessage) {
    const { content, room_id: roomId } = message;
    return {
        ...message,
        content: decrypt(roomId, content) ?? NO_KEYS_MESSAGE,
    } satisfies AuthoredMessage;
}


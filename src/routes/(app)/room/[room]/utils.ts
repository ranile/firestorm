import { writable } from 'svelte/store';
import type { ChunkMessage } from '$lib/utils/messageChunks';

export const replyingToMessage = writable<ChunkMessage | null>(null);
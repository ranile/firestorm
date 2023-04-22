import { writable } from 'svelte/store';
import type { Room } from './db/rooms';

export type UnionFromValues<T> = T[keyof T];

export const currentRoom = writable<Room | null>(null)

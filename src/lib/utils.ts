import { writable } from 'svelte/store';
import type { UserAccount } from 'moe';

export type UnionFromValues<T> = T[keyof T];

export async function splitWith<T>(
    arr: T[],
    fn: (item: T) => Promise<boolean>
): Promise<[T[], T[]]> {
    const trues: T[] = [];
    const falses: T[] = [];
    await Promise.all(
        arr.map(async (item) => {
            const result = await fn(item);
            if (result) {
                trues.push(item);
            } else {
                falses.push(item);
            }
        })
    );
    return [trues, falses];
}

export class Unreachable extends Error {
    constructor(m = '') {
        const append = m === '' ? '' : `: ${m}`;
        super('Unreachable executed' + append);
    }
}

export const loaded = writable(false);

// taken from flowbite-svelte
export const clickOutside = (node: HTMLElement, callback: () => void) => {
    const handleClick = (event: MouseEvent) => {
        if (!event?.target) return;
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            callback();
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
};

export const olmAccount = writable<UserAccount | null>(null);

export const raise = (e: string | Error): never => {
    if (typeof e === 'string') {
        throw new Error(e);
    } else {
        throw e;
    }
};
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    it('splitWith', async () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const [even, odd] = await splitWith(arr, async (item) => item % 2 === 0);
        expect(even).toEqual([2, 4, 6, 8, 10]);
        expect(odd).toEqual([1, 3, 5, 7, 9]);
    });
}

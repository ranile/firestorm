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
    constructor() {
        super('Unreachable executed');
    }
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    it('splitWith', async () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const [even, odd] = await splitWith(arr, async (item) => item % 2 === 0);
        expect(even).toEqual([2, 4, 6, 8, 10]);
        expect(odd).toEqual([1, 3, 5, 7, 9]);
    });
}

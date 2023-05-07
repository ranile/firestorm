import { isToday, isYesterday } from 'date-fns';
import { splitWith } from '$lib/utils';

function formatDate(date: Date): string {
    if (isToday(date)) {
        return 'Today'
    } else if (isYesterday(date)) {
        return 'Yesterday'
    } else {
        return date.toDateString()
    }
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
}

export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return `${formatDate(date)} at ${formatTime(date)}`
}

if (import.meta.vitest) {
    const { it, describe, expect } = import.meta.vitest;
    describe('format dates', () => {
        it('today', () => {
            const date = new Date();
            expect(formatDate(date)).toEqual('Today');
        });

        it('yesterday', () => {
            const date = new Date();
            date.setDate(date.getDate() - 1);
            expect(formatDate(date)).toEqual('Yesterday');
        })

        it('many days ago',() => {
            let date = new Date(2023, 4, 20);

            // this condition exists so that the test won't fail if run on 4/20
            if (isToday(date) || isYesterday(date)) {
                date = new Date(2023, 4, 15);
                expect(formatDate(date)).toEqual('Mon May 15 2023');
            } else {
                expect(formatDate(date)).toEqual('Sat May 20 2023');
            }

        });
    })
}

import { expect, test } from '@playwright/test';
import { createRoom, login, sendTextMessage } from '../utils';
import { ulid } from 'ulidx';

test('should create room and navigate to it', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Create room' }).click();

    const roomName = `test-${ulid()}`;

    await page.getByPlaceholder('What do you want to call your room?').fill(roomName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    const name = await page.locator('nav > button:nth-child(2)').textContent();
    expect(name).toBe(roomName);
});

test('going to room settings and back should not cause messages not to be loaded in realtime', async ({
    page
}) => {
    await login(page);
    const roomName = `test-${ulid()}`;

    await createRoom(page, roomName);
    const message1 = `message-${ulid()}`;
    await sendTextMessage(page, message1);

    await page.getByRole('button', { name: roomName }).click();
    await page.getByRole('link', { name: 'Back to messages' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByText(message1).click(); // ensure we're back on the same page.

    const message2 = `message-${ulid()}`;
    await sendTextMessage(page, message2);
});

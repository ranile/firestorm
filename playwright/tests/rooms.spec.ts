import { expect, Page, test } from '@playwright/test';
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

async function reload(page: Page) {
    await page.reload()
    await page.waitForLoadState('networkidle')
}
test('multi user room', async ({ page: page1, context: context1, browser }) => {
    await login(page1);
    const roomName = ulid();
    await createRoom(page1, roomName)
    await sendTextMessage(page1, `Message 1`);
    const roomUrl = page1.url();
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const { email: email2, username: username2 } = await login(page2);

    await page1.getByRole('button', { name: roomName }).click();
    await page1.getByRole('link', { name: 'Members' }).click();
    await page1.getByRole('button', { name: 'Invite' }).click();
    await page1.getByPlaceholder('name').click();
    await page1.getByPlaceholder('name').fill(email2.toLowerCase());
    await page1.getByRole('dialog').getByRole('button', { name: 'Invite' }).click();
    await page1.getByRole('button', { name: 'Close modal' }).click();

    await reload(page1)
    await page1.getByText(`${username2} (invited)`).click();
    await page1.goto(roomUrl, { waitUntil: 'networkidle'});

    await reload(page2)
    await page2.getByRole('link', { name: roomName }).click();
    await page2.getByRole('button', { name: 'Join' }).click();
    await page2.waitForTimeout(500)
    await reload(page2)
    await page2.getByText(`Message 1`).click();

    await sendTextMessage(page2, `Message 2`);
    await page1.getByText(`Message 2`).click();
});

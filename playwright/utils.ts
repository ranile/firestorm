import { auth } from './config';
import { Page } from '@playwright/test';

export async function login(page: Page) {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Your email address').fill(auth.username);
    await page.getByPlaceholder('Your password').fill(auth.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function createRoom(page: Page, roomName: string) {
    await page.getByRole('button', { name: 'Create room' }).click();
    await page.getByPlaceholder('What do you want to call your room?').fill(roomName);
    await page.getByRole('button', { name: 'Create', exact: true }).click();
}

export async function sendTextMessage(page: Page, message: string) {
    await page.getByPlaceholder('Your message...').fill(message);
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.getByText(message).click(); // wait for message to be sent
}

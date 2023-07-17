import { Page } from '@playwright/test';
import { ulid } from 'ulidx';

export async function login(page: Page) {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    const email = ulid();
    const password = ulid();
    await page.getByRole('link', { name: 'Don\'t have an account? Sign up' }).click();
    await page.getByPlaceholder('Your email address').fill(email + '@firestorm.chat');
    await page.getByPlaceholder('Your password').fill(password);
    await page.getByRole('button', { name: 'Sign up' }).click();
    await page.getByPlaceholder('Username').click();
    await page.getByPlaceholder('Username').fill('username ' + Math.random() * 100);
    await page.getByRole('button', { name: 'Get Started' }).click();
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

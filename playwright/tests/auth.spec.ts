import { expect, test } from '@playwright/test';
import { login } from '../utils';
import { ulid } from 'ulidx';

test('should navigate to home after sign in', async ({ page }) => {
    await login(page);

    await expect(page.getByRole('button', { name: 'Create room' })).toBeVisible();
});

test('should onboard new users', async ({ page, request }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Don\'t have an account? Sign up' }).click();
    const rand = ulid();
    await page.getByPlaceholder('Your email address').fill(`${rand}@firestorm.chat`);
    await page.getByPlaceholder('Your password').fill(rand);
    await page.getByRole('button', { name: 'Sign up' }).click();

    await expect(page.getByText("Check your email for the confirmation link")).toBeVisible();

    const inbucketUrl = `http://localhost:54324/api/v1/mailbox/${rand}`
    const messageId = await request.get(inbucketUrl)
        .then(it => it.json())
        .then(it => it[0].id as string);

    const confirmUrl = await request.get(`${inbucketUrl}/${messageId}`)
        .then(it => it.json())
        .then(it => it.body.text.match(/\((.*)\)/)![1] as string)

    await page.goto(confirmUrl);

    await page.waitForURL('/auth/onboarding');

    const username = `username-${rand}`;
    await page.getByPlaceholder('Username').fill(username);

    await page.getByRole('button', { name: 'Get Started' }).click();

    await page.waitForURL('/')

    await page.getByRole('img').first().click();
    await expect(page.getByText(username)).toBeVisible();
});

test('should stay logged in', (async ({ page, context }) => {
    await login(page);
    await expect(page.getByRole('button', { name: 'Create room' })).toBeVisible();

    await page.close()
    page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Create room' })).toBeVisible();
}))
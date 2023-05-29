import { expect, test } from '@playwright/test';
import { login } from '../utils';

test('should navigate to home after sign in', async ({ page }) => {
    await login(page);
    const createRoomButton = await page.getByRole('button', { name: 'Create room' });
    await expect(createRoomButton).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { createRoom, login, sendTextMessage } from '../utils';
import { ulid } from 'ulidx';
import { join } from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';

async function calculateFileHash(fileData: ArrayBuffer): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(fileData);
    return hash.digest('hex');
}

test('should send message', async ({ page }) => {
    await login(page);
    await createRoom(page, ulid());

    await sendTextMessage(page, `${ulid()} ${Date.now()}`);
});

test.only('should send attachments with a message', async ({ page }) => {
    const file = join(import.meta.url, '../../static/image002.jpg').replace('file:', '');
    const fileData = await fs.readFile(file);
    const expectedHash = await calculateFileHash(fileData);

    await login(page);
    await createRoom(page, ulid());

    // Start waiting for file chooser before clicking. Note no await.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add files' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(file);
    await page.getByPlaceholder('Your message...').fill('message');
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.waitForSelector('.messages img');
    await page.waitForTimeout(4000); // I don't have a way to wait for object url to load

    const imgArrayBuf = await page.evaluate(async () => {
        const img = document.querySelector('.messages img');
        const objectUrl = img.getAttribute('src');
        const response = await fetch(objectUrl);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        return Array.from(uint8Array);
    });
    const buf = Buffer.from(imgArrayBuf);

    const actualHash = await calculateFileHash(buf);
    expect(actualHash).toEqual(expectedHash);
});

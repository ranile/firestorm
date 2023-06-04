import { expect, Page, test } from '@playwright/test';
import { createRoom, login, sendTextMessage } from '../utils';
import { ulid } from 'ulidx';
import { join } from 'path';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';

async function calculateFileHash(fileData: Buffer): Promise<string> {
    const hash = createHash('sha256');
    hash.update(fileData);
    return hash.digest('hex');
}

test('should send message', async ({ page }) => {
    await login(page);
    await createRoom(page, ulid());

    await sendTextMessage(page, `${ulid()} ${Date.now()}`);
    const input = await page.getByPlaceholder('Your message...');
    const content = await input.textContent();
    expect(content).toEqual('');
});

async function getImageFromPageAsBuffer(page: Page) {
    const imgArrayBuf = await page.evaluate(async () => {
        const img = document.querySelector('.messages img');
        const objectUrl = img.getAttribute('src');
        const response = await fetch(objectUrl);
        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        return Array.from(uint8Array);
    });
    return Buffer.from(imgArrayBuf);
}

async function getExpectedFile() {
    const file = join(process.cwd(), 'playwright/static/image002.jpg').replace('file:', '');
    const fileData = await fs.readFile(file);
    const expectedHash = await calculateFileHash(fileData);
    return { file, expectedHash };
}

async function sendMessageWithAttachment(page: Page, file: string, withText: boolean) {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add files' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(file);
    if (withText) {
        await page.getByPlaceholder('Your message...').fill('message');
    }
    await page.getByRole('button', { name: 'Send message' }).click();
    await page.waitForSelector('.messages img');
}

test('should send attachments with a message', async ({ page }) => {
    const { file, expectedHash } = await getExpectedFile();

    await login(page);
    await createRoom(page, ulid());

    // Start waiting for file chooser before clicking. Note no await.
    await sendMessageWithAttachment(page, file, true);
    await page.waitForTimeout(4000); // I don't have a way to wait for object url to load
    const buf = await getImageFromPageAsBuffer(page);

    const actualHash = await calculateFileHash(buf);
    expect(actualHash).toEqual(expectedHash);

    const fileName = file.split('/').at(-1)!;
    const selectedFile = page.getByText(fileName);
    await expect(selectedFile).not.toBeAttached()
});

test('should send attachments in a message with no content', async ({ page }) => {
    const { file, expectedHash } = await getExpectedFile();
    const fileName = file.split('/').at(-1)!;
    await login(page);
    await createRoom(page, ulid());

    // Start waiting for file chooser before clicking. Note no await.
    await sendMessageWithAttachment(page, file, false);
    await page.waitForTimeout(4000); // I don't have a way to wait for object url to load
    const buf = await getImageFromPageAsBuffer(page);

    const actualHash = await calculateFileHash(buf);
    expect(actualHash).toEqual(expectedHash);
    const selectedFile = page.getByText(fileName);
    await expect(selectedFile).not.toBeAttached()
});

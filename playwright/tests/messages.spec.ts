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

function getExpectedFilePath(fileName: string) {
    return join(process.cwd(), 'playwright/static/', fileName).replace('file:', '');
}

async function getExpectedFile() {
    const file = getExpectedFilePath('image002.jpg');
    const fileData = await fs.readFile(file);
    const expectedHash = await calculateFileHash(fileData);
    return { file, expectedHash };
}

async function sendMessageWithAttachment(page: Page, file: string, withText: boolean, wait = true) {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add files' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(file);
    if (withText) {
        await page.getByPlaceholder('Your message...').fill('message');
    }
    await page.getByRole('button', { name: 'Send message' }).click();
    if (wait) {
        await page.waitForSelector('.messages img');
    }
}

test.only('should send attachments with a message', async ({ page }) => {
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
    await expect(selectedFile).not.toBeAttached();
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
    await expect(selectedFile).not.toBeAttached();
});

test('should send non-image attachments in a message', async ({ page }) => {
    const file = getExpectedFilePath('test.txt');
    const fileName = file.split('/').at(-1)!;
    await login(page);
    await createRoom(page, ulid());

    // Start waiting for file chooser before clicking. Note no await.
    await sendMessageWithAttachment(page, file, false, false);

    // expect sent file to be visible
    const selectedFile = page.getByText(fileName);
    await expect(selectedFile).toBeVisible();
});

test('should delete message', async ({ page }) => {
    await login(page);
    await createRoom(page, ulid());

    const message = `${ulid()} ${Date.now()}`;
    await sendTextMessage(page, message);
    await page.getByText(message).hover();

    await page.getByRole('button', { name: 'Delete Message' }).click();
    await expect(page.getByText(message)).not.toBeVisible();
});

test('should edit message', async ({ page }) => {
    await login(page);
    await createRoom(page, ulid());

    const message = `${ulid()} ${Date.now()}`;
    await sendTextMessage(page, message);
    await page.getByText(message).hover();

    await page.getByRole('button', { name: 'Edit Message' }).click();
    await page.getByPlaceholder('Edit message...').fill('edited');
    await page.getByPlaceholder('Edit message...').press('Enter');

    await expect(page.getByText(message)).not.toBeVisible();
    await expect(page.getByText(`edited`)).toBeVisible();
});

test.describe('keys', () => {
    async function removePickleFromLocalStorage(page: Page) {
        return await page.evaluate(() => {
            const roomId = window.location.href.split('/').at(-1)!;
            localStorage.removeItem(`${roomId}:pickle`);
            return roomId;
        });
    }

    async function makeFailedAttemptToSendAMessage(page: Page) {
        await page.getByPlaceholder('Your message...').fill('message');
        let dialogDismissed = false;
        page.on('dialog', async (dialog) => {
            expect(dialog.type()).toEqual('alert');
            expect(dialog.message()).toEqual(
                'No keys for this room found. Please import the keys from another device to send messages here'
            );
            await dialog.dismiss();
            dialogDismissed = true;
        });
        await page.getByRole('button', { name: 'Send message' }).click();
        await page.waitForTimeout(1000);
        expect(dialogDismissed).toEqual(true);
    }

    function streamToString(stream) {
        const chunks = [];
        return new Promise<string>((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
    }

    test('should fail to send message if no keys are present', async ({ page }) => {
        await login(page);
        await createRoom(page, ulid());
        await page.waitForTimeout(800);
        const id = await removePickleFromLocalStorage(page);

        await page.reload();
        await page.goto(`/room/${id}`, { waitUntil: 'networkidle' });
        await makeFailedAttemptToSendAMessage(page);
    });

    test.skip('should export and import keys successfully', async ({ page, browser }) => {
        await login(page);
        await createRoom(page, ulid());
        await page.waitForTimeout(300);

        const roomId = await page.evaluate(() => {
            return window.location.href.split('/').at(-1)!;
        });
        await page.goto('/profile/security');

        const downloadPromise = page.waitForEvent('download');
        await page.waitForTimeout(300);
        await page.getByText('Export room E2E keys').click();
        const download = await downloadPromise;

        const file = await download.createReadStream();
        const keys = await streamToString(file);
        const parsedKeys = JSON.parse(keys);

        expect(parsedKeys[`${roomId}:pickle`]).toBeDefined();

        await page.close();

        const context = await browser.newContext({});
        const newPage = await context.newPage();

        await login(newPage);
        await newPage.waitForURL('/');

        await newPage.goto(`/room/${roomId}`);
        await makeFailedAttemptToSendAMessage(newPage);

        await newPage.goto('/profile/security');
        await newPage.waitForTimeout(300);
        const fileChooserPromise = newPage.waitForEvent('filechooser');
        await newPage.getByText('Import room E2E keys').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'keys.json',
            mimeType: 'application/json',
            buffer: Buffer.from(keys)
        });
        await newPage.goto(`/room/${roomId}`);
        await sendTextMessage(newPage, 'message');
    });
});

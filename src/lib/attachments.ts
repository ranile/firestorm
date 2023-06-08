import {
    initAttachmentsWorker as moeInitAttachmentsWorker,
    JsDecryptAttachmentsWorker,
    type WorkerOutput
} from 'moe';
import { browser } from '$app/environment';

type AttachmentsWorker = ReturnType<typeof moeInitAttachmentsWorker>;

let encryptionWorker: AttachmentsWorker | null = null;

export function initAttachmentsWorker(cb: (v: WorkerOutput) => void) {
    if (!browser) {
        throw Error('initAttachmentsWorker called outside of browser');
    }
    if (encryptionWorker === null) {
        encryptionWorker = moeInitAttachmentsWorker(cb);
    }
    return encryptionWorker;
}

let decryptAttachmentsWorker: JsDecryptAttachmentsWorker | null = null;

export function initDecryptAttachmentsWorker(cb: (v: Uint8Array) => void) {
    if (!browser) {
        throw Error('initDecryptAttachmentsWorker called outside of browser');
    }
    if (decryptAttachmentsWorker === null) {
        decryptAttachmentsWorker = new JsDecryptAttachmentsWorker(
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            () => {}
        );
    }
    return decryptAttachmentsWorker.fork(cb);
}

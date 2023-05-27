import {
    initAttachmentsWorker as moeInitAttachmentsWorker,
    newDecryptAttachmentsWorker,
    type WorkerOutput
} from 'moe';

type AttachmentsWorker = ReturnType<typeof moeInitAttachmentsWorker>;

let encryptionWorker: AttachmentsWorker | null = null;

export function initAttachmentsWorker(cb: (v: WorkerOutput) => void) {
    if (encryptionWorker === null) {
        encryptionWorker = moeInitAttachmentsWorker(cb);
    }
    return encryptionWorker;
}

type JsDecryptAttachmentsWorker = ReturnType<typeof newDecryptAttachmentsWorker>;

let decryptAttachmentsWorker: JsDecryptAttachmentsWorker | null = null;

export function initDecryptAttachmentsWorker(cb: (v: Uint8Array) => void) {
    if (decryptAttachmentsWorker === null) {
        decryptAttachmentsWorker = newDecryptAttachmentsWorker(cb);
    }
    return decryptAttachmentsWorker;
}

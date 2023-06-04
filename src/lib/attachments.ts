import {
    initAttachmentsWorker as moeInitAttachmentsWorker,
    JsDecryptAttachmentsWorker,
    type WorkerOutput
} from 'moe';

type AttachmentsWorker = ReturnType<typeof moeInitAttachmentsWorker>;
;
let encryptionWorker: AttachmentsWorker | null = null;

export function initAttachmentsWorker(cb: (v: WorkerOutput) => void) {
    if (encryptionWorker === null) {
        encryptionWorker = moeInitAttachmentsWorker(cb);
    }
    return encryptionWorker;
}

const decryptAttachmentsWorker: JsDecryptAttachmentsWorker = new JsDecryptAttachmentsWorker(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {}
);

export function initDecryptAttachmentsWorker(cb: (v: Uint8Array) => void) {
    return decryptAttachmentsWorker.fork(cb);
}

import { initAttachmentsWorker as moeInitAttachmentsWorker, type WorkerOutput } from 'moe';

type AttachmentsWorker = ReturnType<typeof moeInitAttachmentsWorker>

let encryptionWorker: AttachmentsWorker | null = null;

export function initAttachmentsWorker(cb: (v: WorkerOutput) => void) {
    if (encryptionWorker === null) {
        encryptionWorker = moeInitAttachmentsWorker(cb);
    }
    return encryptionWorker;
}

import { initAttachmentsWorker as moeInitAttachmentsWorker, type EncryptedFile } from 'moe';

type AttachmentsWorker = ReturnType<typeof moeInitAttachmentsWorker>

let encryptionWorker: AttachmentsWorker | null = null;

export function initAttachmentsWorker(cb: (v: EncryptedFile) => void) {
    if (encryptionWorker === null) {
        encryptionWorker = moeInitAttachmentsWorker(cb);
    }
    return encryptionWorker;
}

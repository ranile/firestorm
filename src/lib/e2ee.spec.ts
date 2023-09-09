import { it, expect, beforeEach } from 'vitest';
import { decrypt, encrypt, init, machine } from './e2ee';
import { EncryptedMessage, IdentityKeys } from 'moe';

beforeEach(() => {
    init('user_id', 'device_id');
})

it('should be able to create a machine', () => {
    expect(machine).toBeDefined();
})

it('should be able to generate identity keys', () => {
    expect(machine.identityKeys).instanceOf(IdentityKeys);
    expect(machine.identityKeys.ed25519).toBeTypeOf('string');
    expect(machine.identityKeys.curve25519).toBeTypeOf('string');
})

it('should be able initialize new room and encrypt/decrypt messages in it', () => {
    const roomId = 'room_id';
    const plaintext = 'plaintext';
    machine.shareRoomKey(roomId, ['user_id']);
    const encrypted = encrypt(roomId, plaintext);
    expect(encrypted).toBeTypeOf('string');
    const decrypted = decrypt(roomId, encrypted!);
    expect(decrypted).toBe(plaintext);
})
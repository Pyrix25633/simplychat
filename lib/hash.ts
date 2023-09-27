import crypto from 'crypto';
import { getTimestamp } from './timestamp';

export function SHA512Hash(data: string): string {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest('hex');
}

export function createUserToken(username: string, passwordHash: string): string {
    return SHA512Hash(username + '.' + passwordHash + '.' + getTimestamp() + '.' + Math.floor(Math.random() * 1000000));
}

export function createTfaToken(username: string, id: number): string {
    return SHA512Hash(username + '.' + id + '.' + getTimestamp() + '.' + Math.floor(Math.random() * 1000000));
}

export function createChatToken(name: string, userId: number): string {
    return SHA512Hash(name + '.' + userId + '.' + getTimestamp() + '.' + Math.floor(Math.random() * 1000000));
}
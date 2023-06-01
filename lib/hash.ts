import crypto from 'crypto';
import { getTimestamp } from './timestamp';

function SHA512Hash(data: string): string {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest('hex');
}

export function createToken(username: string, passwordHash: string): string {
    return SHA512Hash(username + passwordHash + getTimestamp() + Math.floor(Math.random() * 100000));
}
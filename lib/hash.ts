import crypto from 'crypto';

export function SHA512Hash(data: string): string {
    const hash = crypto.createHash('sha512');
    hash.update(data);
    return hash.digest('hex');
}
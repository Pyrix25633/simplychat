import { randomInt, createHash } from 'crypto';
import * as fs from 'fs';

export function generateVerificationCode(): number {
    return randomInt(100000, 1000000);
}

function hash(data: string): string {
    const hash = createHash('sha3-512');
    hash.update(data);
    return hash.digest('hex');
}

export function generateToken(username: string, email: string, passwordHash: string): string {
    return hash(username + '.' + email + '@' + passwordHash + '#' + Date.now() + '&' + randomInt(1000000));
}

function generateColor(): string {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function encodeSvgToBase64(svg: string): string {
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

export function generatePfp(): string {
    let svg: string = '<svg xmlns="http://www.w3.org/2000/svg" height="9" width="9">';
    const color: string = generateColor();
    for(let x = 1; x < 5; x++) {
        for(let y = 1; y < 8; y++) {
            if(Math.random() < 0.5) {
                svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '" />';
                if(x != 4)
                    svg += '<rect x="' + (8 - x) + '" y="' + y + '" width="1"  height="1" fill="' + color + '" />';
            }
        }
    }
    svg += '</svg>';
    return encodeSvgToBase64(svg);
}

export function generateChatLogo(): string {
    let svg: string = '<svg xmlns="http://www.w3.org/2000/svg" height="9" width="9">';
    const color: string = generateColor();
    for(let y = 1; y < 5; y++) {
        for(let x = 1; x < 8; x++) {
            if(Math.random() < 0.5) {
                svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '" />';
                if(y != 4)
                    svg += '<rect x="' + x + '" y="' + (8 - y) + '" width="1"  height="1" fill="' + color + '" />';
            }
        }
    }
    svg += '</svg>';
    return encodeSvgToBase64(svg);
}

export function generateTfaToken(userId: number, pendingTfas: { [index: string]: number; }): string {
    const pendingTfaKeys = Object.keys(pendingTfas);
    for(const t of pendingTfaKeys)
        if(pendingTfas[t] == userId) return t;
    function alreadyInUse(tfaToken: string): boolean {
        for(const t of pendingTfaKeys)
            if(tfaToken == t) return true;
        return false;
    }
    let tfaToken: string;
    do {
        tfaToken = hash('2FAToken:' + userId + '.' + Date.now() + '&' + randomInt(1000000));
    } while(alreadyInUse(tfaToken));
    return tfaToken;
}
import path from 'path';
import * as fs from 'fs';

export const settings: {
    https: {
        cert: string,
        key: string,
        passphrase: string,
        suppressRejectUnauthorized: boolean,
        hostname: string
    }
    mysqlConnection: {
        host: string,
        user: string,
        password: string,
        database: string
    },
    nodemailerTransport: {
        host: string,
        port: number,
        secure: boolean,
        auth: {
            user: string,
            pass: string
        }
    },
    dynamicUpdates: {
        'user-online': boolean,
        'user-settings': boolean,
        'message-new': boolean,
        'chat-settings': boolean,
        'user-join': boolean,
        'user-leave': boolean
    },
    tests: {
        run: boolean,
        static: boolean,
        pages: boolean,
        api: boolean,
        database: string
    }
} = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../settings/settings.json')).toString());
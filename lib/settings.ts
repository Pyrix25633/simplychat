import path from 'path';
import * as fs from 'fs';

export const settings: {
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
        'message-new': boolean,
        'user-online': boolean,
        'user-settings': boolean
    }
} = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../settings/settings.json')).toString());
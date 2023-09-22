# SIMPLY CHAT

An Open-source Web Chat  

Backend made with:
- TypeScript
- Nodejs
- Express
- Bodyparser
- Https
- And more

Frontend made with:
- JavaScript
- HTML
- CSS

## Installation (server)

### Settings file (`./settings/settings.json`)

```ts
{
    https: {
        cert: string,
        key: string,
        passphrase: string,
        suppressRejectUnauthorized: boolean
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
        'user-join': boolean,
        'user-leave': boolean,
        'chat-settings': boolean,
        'message-send': boolean,
        'message-edit': boolean,
        'message-delete': boolean
    },
    tests: {
        run: boolean,
        static: boolean,
        pages: boolean,
        api: boolean,
        database: string
    }
}
```

### Required folders:

- `./pfps/`: to store user profile pictures
- `./chatLogos`: to store chat logos
export const settings = {
    https: {
        cert: "certs/cert.pem",
        key: "certs/key.pem",
        passphrase: "",
        suppressRejectUnauthorized: true,
        hostname: "",
        port: 4443
    },
    jwt: {
        cookieName: "simplychat-auth",
        password: "",
        algorithm: "HS512"
    },
    bcrypt: {
        rounds: 12
    },
    tfa: {
        algorithm: 'sha512',
        window: 2
    },
    nodemailerTransport: {
        host: "",
        port: 465,
        secure: true,
        auth: {
            user: "",
            pass: ""
        }
    },
    dynamicUpdates: {
        'user-online': true,
        'user-settings': true,
        'user-join': true,
        'user-leave': true,
        'chat-settings': true,
        'message-send': true,
        'message-edit': true,
        'message-delete': true,
        'mark-as-read': true
    },
    tests: {
        run: false,
        static: false,
        pages: false,
        api: false,
        database: "test"
    }
};
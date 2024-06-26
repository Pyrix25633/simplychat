import * as bcrypt from "bcrypt";

export const settings = {
    https: {
        cert: "certs/cert.pem",
        key: "certs/key.pem",
        passphrase: "",
        suppressRejectUnauthorized: true,
        hostname: "simplychat.ddns.net",
        port: 4443,
        upgradePort: 8080
    },
    jwt: {
        cookieName: "simplychat-auth",
        password: "jfv5a85?-54sguw17njbgv37_bvo",
        algorithm: "HS512"
    },
    bcrypt: {
        rounds: 12
    },
    tfa: {
        algorithm: 'SHA512',
        window: 2
    },
    nodemailerTransport: {
        host: "smtp.zoho.eu",
        port: 465,
        secure: true,
        auth: {
            user: "simplychat@zohomail.eu",
            pass: "CT-2722@25633"
        }
    },
    simplychatUser: {
        username: 'SimplyChat',
        status: 'The Original!',
        passwordHash: bcrypt.hashSync('StrongPa$$word@2024', 12)
    },
    dynamicUpdates: {
        'user-online': true,
        'user-username-status': true,
        'user-pfp': true,
        'chat-user-join': true,
        'chat-user-leave': true,
        'chat-name-description': true,
        'chat-logo': true,
        'chat-user-permission-level': true,
        'chat-message-send': true,
        'chat-message-edit': true,
        'chat-message-delete': true,
        'chat-mark-as-read': true,
        'status-resources': true,
        'status-database': true
    },
    production: false
};
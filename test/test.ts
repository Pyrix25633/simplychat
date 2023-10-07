import { describe, it } from "node:test";
import * as chai from "chai";
import * as tfa from "speakeasy";
import { IncomingMessage } from "http";
import { port } from "../main";
import { request } from "https";
import { settings } from "../lib/settings";
import { SHA512Hash, createChatToken } from "../lib/hash";
import { query } from "../lib/database";
import { MysqlError } from "mysql";
import { pendingTfa } from "../lib/api/user/authentication";
import { getTimestamp, oneDayTimestamp } from "../lib/timestamp";
import { ExecException, exec } from "child_process";

if(settings.https.suppressRejectUnauthorized)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export function runTests(): void {
    describe('Tests', () => {
        testStatic();
        testPages();
        runInTestDatabase(testApi);
    });
}

function testStatic() {
    if(!settings.tests.static) return;
    describe('Static', () => {
        testGet('CSS', '/css/index.css', 200);
        testGet('JS', '/js/index.js', 200);
        testGet('IMG', '/img/icon.svg', 200);
        testGet('FONT', '/font/aurebesh.otf', 200);
        testGet('PFPS', '/pfps/test.svg', 200);
        testGet('CHAT LOGOS', '/chatLogos/test.svg', 200);
    });
}

function testPages() {
    if(!settings.tests.pages) return;
    describe('Pages', () => {
        testGet('REGISTER', '/register', 200);
        testGet('TERMS AND CONDITIONS', '/terms-and-conditions', 200);
        testGet('CONFIRM', '/confirm', 200);
        testGet('LOGIN', '/login', 200);
        testGet('SETTINGS', '/settings', 200);
        testGet('CREATE CHAT', '/create-chat', 200);
        testGet('CHAT SETTINGS', '/chat-settings', 200);
        testGet('JOIN CHAT', '/join-chat', 200);
        testGet('INDEX', '/', 200);
        testGet('STATUS', '/status', 200);
    });
}

function runInTestDatabase(callback: () => void) {
    it('CREATE DATABASE ' + settings.tests.database, () => {
        query('CREATE DATABASE ' + settings.tests.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('USE ' + settings.tests.database, () => {
        query('USE ' + settings.tests.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('CREATE TABLE ids', () => {
        query(`CREATE TABLE ids (
                table_name VARCHAR(16) NOT NULL,
                next_id INT NOT NULL,
                PRIMARY KEY (table_name)
            );`, [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('INSERT INTO ids', () => {
        query('INSERT INTO ids VALUES ("users", 0);', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('INSERT INTO ids', () => {
        query('INSERT INTO ids VALUES ("chats", 0);', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('CREATE TABLE users', () => {
        query(`CREATE TABLE users (
                id INT NOT NULL,
                username VARCHAR(32) NOT NULL,
                email VARCHAR(64) NULL,
                password_hash CHAR(128) NULL,
                token CHAR(128) NULL,
                token_expiration INT NULL,
                token_duration INT NULL,
                tfa_key CHAR(52) NULL,
                chats JSON NOT NULL,
                online BOOLEAN NOT NULL,
                last_online INT NOT NULL,
                status VARCHAR(64) NOT NULL,
                settings JSON NULL,
                pfp_type VARCHAR(5) NOT NULL,
                PRIMARY KEY (id)
            );`, [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('CREATE TABLE temp_users', () => {
        query(`CREATE TABLE temp_users (
                username VARCHAR(32) NOT NULL,
                email VARCHAR(64) NOT NULL,
                password_hash CHAR(128) NOT NULL,
                verification_code INT NOT NULL,
                timestamp INT NOT NULL,
                PRIMARY KEY (username)
            );`, [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('CREATE TABLE chats', () => {
        query(`CREATE TABLE chats (
                id INT NOT NULL,
                name VARCHAR(64) NOT NULL,
                users JSON NOT NULL,
                description VARCHAR(128) NOT NULL,
                token CHAR(128) NOT NULL,
                token_expiration INT NULL,
                default_permission_level INT NOT NULL,
                chat_logo_type VARCHAR(5) NOT NULL,
                PRIMARY KEY (id)
            );`, [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('mv pfps and chatLogos', () => {
        exec('mv pfps pfps_ && mv chatLogos chatLogos_', (err: ExecException | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('mkdir pfps and chatLogos', () => {
        exec('mkdir pfps && mkdir chatLogos', (err: ExecException | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    callback();
    it('DROP DATABASE ' + settings.tests.database, () => {
        query('DROP DATABASE ' + settings.tests.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('USE ' + settings.mysqlConnection.database, () => {
        query('USE ' + settings.mysqlConnection.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('rm pfps and chatLogos', () => {
        exec('rm -r pfps && rm -r chatLogos', (err: ExecException | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('mv pfps and chatLogos', () => {
        exec('mv pfps_ pfps && mv chatLogos_ chatLogos', (err: ExecException | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
}

function testApi() {
    if(!settings.tests.api) return;
    describe('API', () => {
        const userTokenId = {id: 0, token: ''};
        const setSettingsRequest = {
            token: '',
            id: userTokenId.id,
            username: 'Test 2',
            email: 'fake@gg.com',
            passwordHash: '',
            oldPasswordHash: SHA512Hash('StrongPassword12@'),
            tokenDuration: 16 * oneDayTimestamp,
            tfaActive: true,
            tfaKey: null,
            status: 'Just a Test User',
            settings: {
                compactMode: true,
                condensedFont: true,
                aurebeshFont: true,
                sharpMode: true
            }
        };
        const setPfpRequest = {
            token: '',
            id: userTokenId.id,
            pfp: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
        };
        const createRequest = {
            token: '',
            id: userTokenId.id,
            name: 'Test Chat',
            description: 'Very Long Description'
        };
        const joinRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 1,
            chatToken: ''
        };
        const leaveRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 1
        };
        const chatInfoRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            chatToken: ''
        };
        const getMessageRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            messageId: 0
        };
        const getLastMessagesRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            numberOfMessages: 1
        };
        const sendMessageRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            message: 'Hi @0!\nNice to meet you.'
        };
        const editMessageRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            messageId: 1,
            message: 'Hello there!'
        };
        const deleteMessageRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            messageId: 0
        };
        const getChatSettingsRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0
        };
        const setChatSettingsRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            name: 'Changed Name',
            description: 'Changed Description',
            chatToken: SHA512Hash('Fake token'),
            tokenExpiration: getTimestamp() + oneDayTimestamp,
            defaultPermissionLevel: 3,
            removedUsers: [],
            modifiedUsers: {}
        };
        const setChatLogoRequest = {
            token: '',
            id: userTokenId.id,
            chatId: 0,
            chatLogo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K'
        };
        describe('USER', () => {
            testPost('REGISTER', '/api/user/register', {
                username: 'Test',
                email: 'test@mail.com',
                passwordHash: SHA512Hash('StrongPassword12@')
            }, 201);
            testGet('USERNAME FEEDBACK', '/api/user/username-feedback?username=Test', 200);
            testGet('EMAIL FEEDBACK', '/api/user/email-feedback?email=test@mail.com', 200);
            let verificationRequest = {username: 'Test', verificationCode: 0};
            it('SELECT verification_code', async () => {
                await new Promise<void>((resolve): void => {
                    query('SELECT verification_code FROM temp_users WHERE username=\'Test\';', [], (err: MysqlError | null, results?: any): void => {
                        verificationRequest.verificationCode = results[0].verification_code;
                        chai.expect(err).to.equal(null);
                        resolve();
                    });
                });
            });
            testPost('CONFIRM', '/api/user/confirm', verificationRequest, 200);
            testGet('USERNAME CONFIRM FEEDBACK', '/api/user/username-confirm-feedback?username=Test', 200);
            let tfaKey = tfa.generateSecret().base32;
            it('UPDATE users SET tfa_key', async () => {
                await new Promise<void>((resolve): void => {
                    query('UPDATE users SET tfa_key=? WHERE id=0;', [tfaKey], (err: MysqlError | null): void => {
                        chai.expect(err).to.equal(null);
                        resolve();
                    });
                });
            });
            testPost('LOGIN', '/api/user/login', {
                username: 'Test',
                passwordHash: SHA512Hash('StrongPassword12@')
            }, 200);
            testGet('USERNAME LOGIN FEEDBACK', '/api/user/username-login-feedback?username=Test', 200);
            const tfauthenticateRequest = {
                id: 0,
                tfaToken: '',
                tfaCode: tfa.totp({secret: tfaKey, encoding: 'base32'})
            };
            it('GET pendingTfa', () => {
                const tfaToken = pendingTfa.get(0);
                if(tfaToken != undefined)
                    tfauthenticateRequest.tfaToken = tfaToken;
            });
            testPost('2 FACTOR AUTHENTICATE', '/api/user/tfauthenticate', tfauthenticateRequest, 200);
            testPost('VALIDATE TOKEN', '/api/user/validate-token', {
                id: 0,
                token: SHA512Hash('Fake token')
            }, 200);
            it('SELECT token', async () => {
                await new Promise<void>((resolve): void => {
                    query('SELECT token FROM users WHERE id=0;', [], (err: MysqlError | null, results?: any): void => {
                        userTokenId.token = results[0].token;
                        chai.expect(err).to.equal(null);
                        resolve();
                    });
                });
            });
            testPost('REGENERATE TOKEN', '/api/user/regenerate-token', userTokenId, 200);
            it('SELECT token', async () => {
                await new Promise<void>((resolve): void => {
                    query('SELECT token FROM users WHERE id=0;', [], (err: MysqlError | null, results?: any): void => {
                        const token = results[0].token;
                        userTokenId.token = token;
                        setSettingsRequest.token = token;
                        setPfpRequest.token = token;
                        createRequest.token = token;
                        joinRequest.token = token;
                        leaveRequest.token = token;
                        chatInfoRequest.token = token;
                        getMessageRequest.token = token;
                        getLastMessagesRequest.token = token;
                        sendMessageRequest.token = token;
                        editMessageRequest.token = token;
                        deleteMessageRequest.token = token;
                        getChatSettingsRequest.token = token;
                        setChatSettingsRequest.token = token;
                        setChatLogoRequest.token = token;
                        chai.expect(err).to.equal(null);
                        resolve();
                    });
                });
            });
            testGet('GENERATE TFA KEY', '/api/user/generate-tfa-key', 200);
            testPost('VERIFIFY TFA CODE', '/api/user/verify-tfa-code', {
                tfaKey: tfaKey,
                tfaCode: tfa.totp({secret: tfaKey, encoding: 'base32'})
            }, 200);
            testPost('GET SETTINGS', '/api/user/get-settings', userTokenId, 200);
            testPost('SET SETTINGS', '/api/user/set-settings', setSettingsRequest, 200);
            testPost('SET PFP', '/api/user/set-pfp', setPfpRequest, 200);
        });
        describe('CHAT', () => {
            testPost('CREATE', '/api/chat/create', createRequest, 201);
            it('INSERT INTO chats', async () => {
                await new Promise<void>((resolve): void => {
                    const token = createChatToken('Test Chat', 0);
                    query('INSERT INTO chats VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
                        [1, 'Test Chat', '{}', 'Test Description', token, null, 2, 'svg'],
                        (err: MysqlError | null): void => {
                            joinRequest.chatToken = token;
                            chai.expect(err).to.equal(null);
                            resolve();
                        });
                });
            });
            it('UPDATE ids', () => {
                query('UPDATE ids SET next_id=2 WHERE table_name=?;', ['chats'], (err: MysqlError | null): void => {
                    chai.expect(err).to.equal(null);
                });
            });
            it('CREATE TABLE chat1', () => {
                query(`CREATE TABLE chat1 (
                        id INT NOT NULL,
                        timestamp INT NOT NULL,
                        user_id INT NOT NULL,
                        message BLOB NOT NULL,
                        edited BOOLEAN NOT NULL,
                        deleted BOOLEAN NOT NULL,
                        PRIMARY KEY (id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    );`, [], (err: MysqlError | null): void => {
                        chai.expect(err).to.equal(null);
                    });
            });
            it('INSERT INTO ids', () => {
                query('INSERT INTO ids VALUES (?, 0);', ['chat1'], (err: MysqlError | null): void => {
                    chai.expect(err).to.equal(null);
                });
            });
            testPost('JOIN', '/api/chat/join', joinRequest, 200);
            testPost('LEAVE', '/api/chat/leave', leaveRequest, 200);
            testPost('LIST', '/api/chat/list', userTokenId, 200);
            testPost('INFO', '/api/chat/info', chatInfoRequest, 200);
            it('SELECT token', async () => {
                await new Promise<void>((resolve): void => {
                    query('SELECT token FROM chats WHERE id=0;', [], (err: MysqlError | null, results?: any): void => {
                        chatInfoRequest.chatToken = results[0].token;
                        chai.expect(err).to.equal(null);
                        resolve();
                    });
                });
            });
            testPost('JOIN INFO', '/api/chat/join-info', chatInfoRequest, 200);
            testPost('GET MESSAGE', '/api/chat/get-message', getMessageRequest, 200);
            testPost('GET LAST MESSAGES', '/api/chat/get-last-messages', getLastMessagesRequest, 200);
            testPost('SEND MESSAGE', '/api/chat/send-message', sendMessageRequest, 201);
            testPost('EDIT MESSAGE', '/api/chat/edit-message', editMessageRequest, 200);
            testPost('DELETE MESSAGE', '/api/chat/delete-message', deleteMessageRequest, 200);
            testPost('GET SETTINGS', '/api/chat/get-settings', getChatSettingsRequest, 200);
            testPost('GENERATE TOKEN', '/api/chat/generate-token', getChatSettingsRequest, 200);
            testPost('SET SETTINGS', '/api/chat/generate-token', setChatSettingsRequest, 200);
            testPost('SET CHAT LOGO', '/api/chat/set-chat-logo', setChatLogoRequest, 200);
        });
    });
}

const getOptions = {
    host: '127.0.0.1',
    port: 0,
    method: 'GET',
    path: ''
};

function testGet(test: string, path: string, expect: number): void {
    it(test, async () => {
        const options = getOptions;
        options.port = port;
        options.path = path;
        const promise = new Promise<void>((resolve, reject) => {
            const req = request(options, (res: IncomingMessage) => {
                chai.expect(res.statusCode).to.equal(expect);
                resolve();
            });
            req.end();
        });
        await promise;
    });
}

const postOptions = {
    host: '127.0.0.1',
    port: 0,
    method: 'POST',
    path: '',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
};

async function testPost(test: string, path: string, data: {}, expect: number): Promise<void> {
    it(test, async () => {
        const options = postOptions;
        options.port = port;
        options.path = path;
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = postData.length;
        const promise = new Promise<void>((resolve, reject) => {
            const req = request(options);
            req.write(postData);
            req.end();
            req.on('response', (res: IncomingMessage) => {
                chai.expect(res.statusCode).to.equal(expect);
                resolve();
            });
        });
        await promise;
    });
}
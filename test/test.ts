import { describe, it } from "node:test";
import * as chai from "chai";
import { IncomingMessage } from "http";
import { port } from "../main";
import { request } from "https";
import { settings } from "../lib/settings";
import { SHA512Hash } from "../lib/hash";
import { query } from "../lib/database";
import { MysqlError } from "mysql";

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
        testGet('404', '/404', 404);
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
        testGet('404', '/404', 404);
    });
}

function runInTestDatabase(callback: () => void) {
    it('CREATE DATABASE ' + settings.tests.database, () => {
        query('CREATE DATABASE ' + settings.tests.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('USE DATABASE ' + settings.tests.database, () => {
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
    callback();
    it('DROP DATABASE ' + settings.tests.database, () => {
        query('DROP DATABASE ' + settings.tests.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
    it('USE DATABASE ' + settings.mysqlConnection.database, () => {
        query('USE ' + settings.mysqlConnection.database + ';', [], (err: MysqlError | null): void => {
            chai.expect(err).to.equal(null);
        });
    });
}

function testApi() {
    if(!settings.tests.api.user && !settings.tests.api.user) return;
    describe('API', () => {
        if(settings.tests.api.user)
            describe('USER', () => {
                testPost('REGISTER', '/api/user/register', {
                    username: 'Test',
                    email: 'test@mail.com',
                    passwordHash: SHA512Hash('StrongPassword12@')
                }, 201);
                testGet('USERNAME FEEDBACK', '/api/user/username-feedback?username=Test', 200);
                testGet('EMAIL FEEDBACK', '/api/user/email-feedback?email=test@mail.com', 200);
            });
        if(settings.tests.api.chat)
            describe('CHAT', () => {

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
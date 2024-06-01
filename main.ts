import bodyParser from 'body-parser';
import cookieParser from "cookie-parser";
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import path from 'path';
import { Server } from 'socket.io';
import { getTfaGenerateKey, getTfaValidateCode, getValidateToken, postLogin, postLoginTfa, postLogout, postRegenerateToken } from './lib/api/auth';
import { deleteChatMessage, getChat, getChatJoin, getChatMessages, getChatSettings, getChatUsers, getChats, patchChatMessage, patchChatSettings, postChat, postChatJoin, postChatLeave, postChatMarkAsRead, postChatMessage, postChatRegenerateToken } from './lib/api/chats';
import { getConfirmUsernameFeedback, getLoginUsernameFeedback, getRegisterEmailFeedback, getRegisterUsernameFeedback } from './lib/api/feedbacks';
import { getSettings, getSettingsCustomization, getSettingsId, patchSettings } from './lib/api/settings';
import { postTempUser, postTempUserConfirm } from './lib/api/temp-users';
import { getUser } from './lib/api/users';
import { settings } from './lib/settings';
import { onConnect } from './lib/socket';

const main: Express = express();
const upgradeMain: Express = express();

main.set('trust proxy', true);
main.use(cookieParser());
main.use(bodyParser.urlencoded({ extended: true }));
main.use(bodyParser.json({ limit: '6mb' }));
main.use(cors());
main.use(helmet());
main.use(helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
        "default-src": ["'self'"],
        "base-uri": "'self'",
        "font-src": ["'self'", "https:"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'", "data:"],
        "object-src": ["'none'"],
        "script-src": ["'self'", "https:"],
        "script-src-attr": "'none'",
        "style-src": ["'self'", "https:", "data:", "'unsafe-inline'"],
    }
}));
main.use('/css', express.static('./pages/css'));
main.use('/js', express.static('./pages/js'));
main.use('/img', express.static('./pages/img'));
main.use('/font', express.static('./pages/font'));
main.use('/pfps', express.static('./pfps'));
main.use('/chatLogos', express.static('./chatLogos'));

// --api-- //

// feedbacks //

main.get('/api/feedbacks/register-username', getRegisterUsernameFeedback);

main.get('/api/feedbacks/register-email', getRegisterEmailFeedback);

main.get('/api/feedbacks/confirm-username', getConfirmUsernameFeedback);

main.get('/api/feedbacks/login-username', getLoginUsernameFeedback);

// temp-users //

main.post('/api/temp-users', postTempUser);

main.post('/api/temp-users/:username/confirm', postTempUserConfirm);

// auth //

main.get('/api/auth/validate-token', getValidateToken);

main.post('/api/auth/login', postLogin);

main.post('/api/auth/login-tfa', postLoginTfa);

main.get('/api/auth/tfa/generate-key', getTfaGenerateKey);

main.get('/api/auth/tfa/validate-code', getTfaValidateCode);

main.post('/api/auth/logout', postLogout);

main.post('/api/auth/regenerate-token', postRegenerateToken);

// settings //

main.get('/api/settings', getSettings);

main.patch('/api/settings', patchSettings);

main.get('/api/settings/customization', getSettingsCustomization);

main.get('/api/settings/id', getSettingsId);

// users//

main.get('/api/users/:userId', getUser);

// chats //

main.get('/api/chats', getChats);

main.post('/api/chats', postChat);

main.get('/api/chats/:chatId', getChat);

main.get('/api/chats/:chatId/join', getChatJoin);

main.post('/api/chats/:chatId/join', postChatJoin);

main.get('/api/chats/:chatId/settings', getChatSettings);

main.patch('/api/chats/:chatId/settings', patchChatSettings);

main.post('/api/chats/:chatId/regenerate-token', postChatRegenerateToken);

main.get('/api/chats/:chatId/users', getChatUsers);

main.post('/api/chats/:chatId/leave', postChatLeave);

main.get('/api/chats/:chatId/messages', getChatMessages);

main.post('/api/chats/:chatId/messages', postChatMessage);

main.patch('/api/chats/:chatId/messages/:messageId', patchChatMessage);

main.delete('/api/chats/:chatId/messages/:messageId', deleteChatMessage);

main.post('/api/chats/:chatId/mark-as-read', postChatMarkAsRead);

// --server-- //

const options = {
    key: fs.readFileSync(path.resolve(__dirname, settings.https.key)),
    cert: fs.readFileSync(path.resolve(__dirname, settings.https.cert)),
    passphrase: settings.https.passphrase
};
const server = https.createServer(options, main);
server.listen(settings.https.port, (): void => {
    console.log('Server listening on Port ' + settings.https.port);
});
upgradeMain.all('*', (req, res): void => {
    res.redirect(301, 'https://' + req.hostname + (settings.production ? '' : (':' + settings.https.port)));
});
const upgradeServer = http.createServer(upgradeMain);
upgradeServer.listen(settings.https.upgradePort, (): void => {
    console.log('Upgrade Server listening on Port ' + settings.https.upgradePort);
});

const io = new Server(server);
io.on('connect', onConnect);

// --pages-- //

main.get('/register', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/register.html'));
});

main.get('/terms-and-conditions', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/terms-and-conditions.html'));
});

main.get('/temp-users/:username/confirm', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/confirm.html'));
});
main.get('/confirm', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/confirm.html'));
});

main.get('/login', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/login.html'));
});

main.get('/settings', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/settings.html'));
});

main.get('/chats/create', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/chat-create.html'));
});

main.get('/chats/:chatId/settings', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/chat-settings.html'));
});

main.get('/chats/:chatId/join', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/chat-join.html'));
});

main.get('/', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/index.html'));
});

main.get('/status', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/status.html'));
});

main.get('/error', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/error.html'));
})
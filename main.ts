import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { Server } from 'socket.io';
import { settings } from './lib/settings';
import { postTempUser, postTempUserConfirm } from './lib/api/temp-users';
import { getConfirmUsernameFeedback, getLoginUsernameFeedback, getRegisterEmailFeedback, getRegisterUsernameFeedback } from './lib/api/feedbacks';
import { getTfaGenerateKey, getTfaValidateCode, getValidateToken, postLogin, postLoginTfa, postLogout, postRegenerateToken } from './lib/api/auth';
import cookieParser from "cookie-parser";
import { getSettings, getSettingsCustomization, patchSettings } from './lib/api/settings';
import { getChatJoin, getChatSettings, postChat, postChatJoin, postChatRegenerateToken } from './lib/api/chats';

const main: Express = express();
export const port: number = settings.https.port;

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

//// api ////

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

main.get('/api/settings/customization', getSettingsCustomization);

main.patch('/api/settings', patchSettings);

// chats //

main.post('/api/chats', postChat);

main.get('/api/chats/:chatId/join', getChatJoin);

main.post('/api/chats/:chatId/join', postChatJoin);

main.get('/api/chats/:chatId/settings', getChatSettings);

main.post('/api/chats/:chatId/regenerate-token', postChatRegenerateToken);

//// server ////

const options = {
    key: fs.readFileSync(path.resolve(__dirname, settings.https.key)),
    cert: fs.readFileSync(path.resolve(__dirname, settings.https.cert)),
    passphrase: settings.https.passphrase
};
export const server = https.createServer(options, main);
server.listen(port, () => {
    console.log('Server listening on port ' + port);
});

const io = new Server(server);
//io.on('connect', onConnect);

//initializeStatus();

//// pages ////

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

//// tests ////

//if(settings.tests.run)
    //runTests();
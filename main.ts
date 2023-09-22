import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { Server } from 'socket.io';
import { confirm, emailFeedback, register, usernameConfirmFeedback, usernameFeedback } from './lib/api/user/registration';
import { generateTfaKey, login, regenerateToken, tfauthenticate, usernameLoginFeedback, validateToken, verifyTfaCode } from './lib/api/user/authentication';
import { userInfo } from './lib/api/user/info';
import { getUserSettings, setPfp, setUserSettings } from './lib/api/user/settings';
import { create, join, leave } from './lib/api/chat/management';
import { chatInfo, chatJoinInfo, list } from './lib/api/chat/info';
import { deleteMessage, editMessage, getLastMessages, getMessage, sendMessage } from './lib/api/chat/messages';
import { onConnect } from './lib/socket';
import { generateChatToken, getChatSettings, setChatLogo, setChatSettings } from './lib/api/chat/settings';
import { runTests } from './test/test';
import { settings } from './lib/settings';

const main: Express = express();
export const port: number = 4443;

main.set('trust proxy', true)
main.use(bodyParser.urlencoded({extended: true}));
main.use(bodyParser.json({limit: '6mb'}));
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
        "style-src": ["'self'", "https:", "data:"],
    }
}));
main.use('/css', express.static('./pages/css'));
main.use('/js', express.static('./pages/js'));
main.use('/img', express.static('./pages/img'));
main.use('/font', express.static('./pages/font'));
main.use('/pfps', express.static('./pfps'));
main.use('/chatLogos', express.static('./chatLogos'));

//// api ////

// user //

// registration

main.post('/api/user/register', register);

main.get('/api/user/username-feedback', usernameFeedback);

main.get('/api/user/email-feedback', emailFeedback);

main.post('/api/user/confirm', confirm);

main.get('/api/user/username-confirm-feedback', usernameConfirmFeedback);

// authentication

main.post('/api/user/login', login);

main.get('/api/user/username-login-feedback', usernameLoginFeedback);

main.post('/api/user/tfauthenticate', tfauthenticate);

main.post('/api/user/validate-token', validateToken);

main.post('/api/user/regenerate-token', regenerateToken);

main.get('/api/user/generate-tfa-key', generateTfaKey);

main.post('/api/user/verify-tfa-code', verifyTfaCode);

// info

main.post('/api/user/info', userInfo);

// settings

main.post('/api/user/get-settings', getUserSettings);

main.post('/api/user/set-settings', setUserSettings);

main.post('/api/user/set-pfp', setPfp);

// chat //

// management

main.post('/api/chat/create', create);

main.post('/api/chat/join', join);

main.post('/api/chat/leave', leave);

// info

main.post('/api/chat/list', list);

main.post('/api/chat/info', chatInfo);

main.post('/api/chat/join-info', chatJoinInfo)

// messages

main.post('/api/chat/get-message', getMessage);

main.post('/api/chat/get-last-messages', getLastMessages);

main.post('/api/chat/send-message', sendMessage);

main.post('/api/chat/edit-message', editMessage);

main.post('/api/chat/delete-message', deleteMessage);

// settings

main.post('/api/chat/get-settings', getChatSettings);

main.post('/api/chat/generate-token', generateChatToken)

main.post('/api/chat/set-settings', setChatSettings);

main.post('/api/chat/set-chat-logo', setChatLogo);

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
io.on('connect', onConnect);

//// pages ////

main.get('/register', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/register.html'));
});

main.get('/terms-and-conditions', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/terms-and-conditions.html'));
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

main.get('/create-chat', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/create-chat.html'));
});

main.get('/chat-settings', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/chat-settings.html'));
});

main.get('/join-chat', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/join-chat.html'));
});

main.get('/', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/index.html'));
});

main.get('/status', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/status.html'));
});

//// test ////

if(settings.tests.run)
    runTests();
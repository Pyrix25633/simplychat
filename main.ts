import express, { Express, Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { createChat, selectChat, selectLastMessages } from './lib/database';
import { createChatToken } from './lib/hash';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { generateRandomChatLogo } from './lib/random-image';
import { ChatInfoRequest, CreateRequest, GetLastMessagesRequest, ListRequest, isChatInfoRequestValid, isCreateRequestValid, isGetLastMessagesRequestValid, isListRequestValid } from './lib/types/api/chat';
import { confirm, emailFeedback, register, usernameConfirmFeedback, usernameFeedback } from './lib/api/user/registration';
import { generateTfaKey, login, regenerateToken, tfauthenticate, usernameLoginFeedback, validateToken, validateTokenAndProceed, verifyTfaCode } from './lib/api/user/authentication';
import { userInfo } from './lib/api/user/info';
import { getSettings, setPfp, setSettings } from './lib/api/user/settings';

const main: Express = express();
const port: number = 4443;

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

main.post('/api/user/get-settings', getSettings);

main.post('/api/user/set-settings', setSettings);

main.post('/api/user/set-pfp', setPfp);

// chat //

main.post('/api/chat/create', (req: Request, res: Response): void => {
    const request: CreateRequest = req.body;
    if(!isCreateRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        createChat(user.id, request.name, request.description, createChatToken(request.name, user.id), (err: MysqlError | null, id: number | null): void => {
            if(err || id == null) {
                res.status(500).send('Internal Server Error');
                return;
            }
            generateRandomChatLogo(id);
            res.status(201).send('Created');
        });
    });
});

main.post('/api/chat/list', (req: Request, res: Response): void => {
    const request: ListRequest = req.body;
    if(!isListRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        res.status(200).send({chats: JSON.parse(user.chats)});
    });
});

main.post('/api/chat/info', (req: Request, res: Response): void => {
    const request: ChatInfoRequest = req.body;
    if(!isChatInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        const chats = JSON.parse(user.chats);
        if(user.chats[request.chatId] != undefined) {
            selectChat(request.chatId, (err: MysqlError | null, results: any): void => {
                if(err || results.length == 0) {
                    res.status(500).send('Internal Server Error');
                    return;
                }
                const selected = results[0];
                res.status(200).send({
                    name: selected.name,
                    description: selected.description,
                    chatLogoType: selected.chat_logo_type,
                    users: JSON.parse(selected.users)
                });
            });
        }
        else
            res.status(403).send('Forbidden');
    });
});

main.post('/api/chat/get-last-messages', (req: Request, res: Response): void => {
    const request: GetLastMessagesRequest = req.body;
    if(!isGetLastMessagesRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        const chats = JSON.parse(user.chats);
        if(chats[request.chatId] != undefined) {
            selectLastMessages(request.chatId, request.numberOfMessages, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                const lastMessages: {lastMessages: any[]} = {lastMessages: []};
                for(let message of results) {
                    lastMessages.lastMessages.push({
                        id: message.id,
                        timestamp: message.timestamp,
                        userId: message.user_id,
                        message: message.message,
                        modified: message.modified
                    });
                }
                res.status(200).send(lastMessages);
            });
        }
        else
            res.status(403).send('Forbidden');
    });
});

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

main.get('/', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/index.html'));
});

const options = {
    key: fs.readFileSync(path.resolve(__dirname, './certs/privateKey.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './certs/certificate.pem'))
};

https.createServer(options, main).listen(port, () => {
    console.log('Server listening on port ' + port);
});
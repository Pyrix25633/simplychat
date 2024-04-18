import express, { Express, Request, Response } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { Server } from 'socket.io';
import { settings } from './lib/settings';
import { getRegisterEmailFeedback, getRegisterUsernameFeedback, postTempUser } from './lib/api/temp-users';

const main: Express = express();
export const port: number = settings.https.port;

main.set('trust proxy', true)
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

// temp-users //

main.post('/temp-users', postTempUser);

main.post('/register-username-feedback', getRegisterUsernameFeedback);

main.post('/register-email-feedback', getRegisterEmailFeedback);

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

//// tests ////

//if(settings.tests.run)
    //runTests();
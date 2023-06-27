import express, { Express, Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { ConfirmRequest, GetSettingsRequest, LoginRequest, RegisterRequest, SetPfpRequest, SetSettingsRequest, UserInfoRequest, UsernameFeedbackResponse, ValidateTokenRequest, isConfirmRequestValid, isEmailFeedbackRequestValid, isGetSettingsRequestValid, isLoginRequestValid, isRegisterRequestValid, isSetPfpRequestValid, isSetSettingsRequestValid, isUserInfoRequestValid, isUsernameConfirmFeedbackRequestValid, isUsernameFeedbackRequestValid, isValidateTokenRequestValid } from './lib/types/api/user';
import { createChat, insertTempUser, selectChat, selectFromEmail, selectFromUsername, selectFromUsernameOrEmail, selectLastMessages, selectTempUser, selectUser, selectUserFromUsername, selectUserToken, updateUser, updateUserPfpType, updateUserToken } from './lib/database';
import { createUserToken, createChatToken } from './lib/hash';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { sendEmail } from './lib/email';
import Mail from 'nodemailer/lib/mailer';
import { deleteTempUser } from './lib/database';
import { createUser } from './lib/database';
import { getTimestamp, oneDayTimestamp } from './lib/timestamp';
import { generateRandomChatLogo, generateRandomPfp } from './lib/random-image';
import { ChatInfoRequest, CreateRequest, GetLastMessagesRequest, ListRequest, isChatInfoRequestValid, isCreateRequestValid, isGetLastMessagesRequestValid, isListRequestValid } from './lib/types/api/chat';

const main: Express = express();
const port: number = 4443;

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

main.post('/api/user/register', (req: Request, res: Response): void => {
    const request: RegisterRequest = req.body;
    if(!isRegisterRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    for(let i = 0; i < request.username.length; i++) {
        const c = request.username.codePointAt(i);
        if((c == undefined) || !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
            res.status(400).send('Bad Request');
            return;
        }
    }
    if(!request.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectFromUsernameOrEmail(request.username, request.email, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            const verificationCode: number = Math.floor(100000 + Math.random() * 900000);
            const mailOptions: Mail.Options = {
                to: request.email,
                subject: 'Simply Chat verification code',
                text: 'Your verification code for username ' + request.username + ' is ' + verificationCode + '.',
                html: 'Your verification code for username ' + request.username + ' is ' + verificationCode +
                    '.<br> Click <a href="https://simplychat.ddns.net:4443/confirm?username=' + request.username +
                    '&verificationCode=' + verificationCode + '">here</a> to confirm your registration.' +
                    '<br> If the link above does not work open <a href="https://simplychat.ddns.net:4443/confirm">' +
                    'this page</a> and enter username and verification code.'
            };
            sendEmail(mailOptions, (err: Error | null): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                insertTempUser(request, verificationCode, (err: MysqlError | null): void => {
                    if(err) {
                        res.status(500).send('Internal Server Error');
                        console.log(err);
                        return;
                    }
                    res.status(201).send('Created');
                });
            });
        }
        else
            res.status(400).send('Bad Request');
    });
});

main.get('/api/user/username-feedback', (req: Request, res: Response): void => {
    const request: any = req.query.username;
    if(!isUsernameFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: UsernameFeedbackResponse = {feedback: null};
    if(request.length < 4) response.feedback = 'Username too short!';
    else if(request.length > 32) response.feedback = 'Username too long!';
    else {
        for(let i = 0; i < request.length; i++) {
            const c = request.codePointAt(i);
            if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
                response.feedback = 'Username contains forbidden character!';
                break;
            }
        }
    }
    if(response.feedback != null) {
        res.status(200).send(response);
        return;
    }
    selectFromUsername(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            res.status(200).send({feedback: 'Valid username'});
        else
            res.status(200).send({feedback: 'Username already taken!'});
    });
});

main.get('/api/user/email-feedback', (req: Request, res: Response): void => {
    const request: any = req.query.email;
    if(!isEmailFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    if(!request.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        res.status(200).send({feedback: 'Invalid Email!'});
        return;
    }
    selectFromEmail(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            res.status(200).send({feedback: 'Valid Email'});
        else
            res.status(200).send({feedback: 'Email already used!'});
    });
});

main.post('/api/user/confirm', (req: Request, res: Response): void => {
    const request: ConfirmRequest = req.body;
    if(!isConfirmRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectTempUser(request.username, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            res.status(404).send('Not Found');
            return;
        }
        const tempUser: {
            id: number,
            username: string,
            email: string,
            password_hash: string,
            verification_code: number
        } = results[0];
        if(tempUser.verification_code != request.verificationCode) {
            res.status(401).send('Unauthorized');
            return;
        }
        deleteTempUser(request.username, (err: MysqlError | null, results: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            const token: string = createUserToken(tempUser.username, tempUser.password_hash);
            createUser(tempUser.username, tempUser.email, tempUser.password_hash, token, (err: MysqlError | null, id: number | null): void => {
                if(err || id == null) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                generateRandomPfp(id);
                res.status(200).send({id: id, token: token});
            });
        });
    });
});

main.get('/api/user/username-confirm-feedback', (req: Request, res: Response): void => {
    const request: any = req.query.username;
    if(!isUsernameConfirmFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    const response: UsernameFeedbackResponse = {feedback: null};
    if(request.length < 4 || request.length > 32) response.feedback = 'Invalid Username!';
    else {
        for(let i = 0; i < request.length; i++) {
            const c = request.codePointAt(i);
            if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
                response.feedback = 'Invalid Username!';
                break;
            }
        }
    }
    if(response.feedback != null) {
        res.status(200).send(response);
        return;
    }
    selectTempUser(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            selectUserFromUsername(request, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                if(results.length == 0)
                    res.status(200).send({feedback: 'Username does not exist!'});
                else
                    res.status(200).send({feedback: 'Username already confirmed!'});
            });
        else
            res.status(200).send({feedback: 'Valid Username'});
    });
});

main.post('/api/user/login', (req: Request, res: Response): void => {
    const request: LoginRequest = req.body;
    if(!isLoginRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectUserFromUsername(request.username, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            res.status(404).send('Not Found');
            return;
        }
        const user = results[0];
        if(user.password_hash != request.passwordHash) {
            console.log(request, user);
            res.status(401).send('Unauthorized');
            return;
        }
        if(user.token_expiration - oneDayTimestamp < getTimestamp()) {
            const token = createUserToken(user.username, user.password_hash);
            res.status(200).send({id: user.id, token: token});
            updateUserToken(user.id, token);
            return;
        }
        res.status(200).send({id: user.id, token: user.token});
    });
});

main.get('/api/user/username-login-feedback', (req: Request, res: Response): void => {
    const request: any = req.query.username;
    if(!isUsernameFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectUserFromUsername(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            res.status(200).send({feedback: 'Username does not exist!'});
        else
            res.status(200).send({feedback: 'Valid Username'});
    });
});

main.post('/api/user/validate-token', (req: Request, res: Response): void => {
    const request: ValidateTokenRequest = req.body;
    if(!isValidateTokenRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectUserToken(request.id, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            res.status(404).send('Not Found');
            return;
        }
        const user = results[0];
        res.status(200).send({valid: user.token == request.token && user.token_expiration > getTimestamp()});
    });
});

function validateToken(id: number, token: string, res: Response, callback: (user: any) => void): void {
    selectUser(id, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            res.status(404).send('Not Found');
            return;
        }
        const user = results[0];
        if(user.token == token && user.token_expiration > getTimestamp())
            callback(user);
        else
            res.status(401).send('Unauthorized');
    });
}

main.post('/api/user/info', (req: Request, res: Response): void => {
    const request: UserInfoRequest = req.body;
    if(!isUserInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
        selectUser(request.userId, (err: MysqlError | null, results: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            const selected = results[0];
            res.status(200).send({
                username: selected.username,
                status: selected.status,
                pfpType: selected.pfp_type
            });
        });
    });
});

main.post('/api/user/get-settings', (req: Request, res: Response): void => {
    const request: GetSettingsRequest = req.body;
    if(!isGetSettingsRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
        res.status(200).send({
            username: user.username,
            email: user.email,
            status: user.status,
            settings: JSON.parse(user.settings),
            pfpType: user.pfp_type
        });
    });
});

main.post('/api/user/set-settings', (req: Request, res: Response): void => {
    const request: SetSettingsRequest = req.body;
    if(!isSetSettingsRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
        for(let i = 0; i < request.username.length; i++) {
            const c = request.username.codePointAt(i);
            if((c == undefined) || !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
                res.status(400).send('Bad Request');
                return;
            }
        }
        if(!request.email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
            res.status(400).send('Bad Request');
            return;
        }
        if(user.username != request.username) {
            selectFromUsername(request.username, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                if(results.length == 0) {
                    checkEmail();
                }
                else
                    res.status(400).send('Bad Request');
            });
        }
        else {
            checkEmail();
        }
        function checkEmail() {
            if(user.email != request.email) {
                selectFromEmail(request.email, (err: MysqlError | null, results: any): void => {
                    if(err) {
                        res.status(500).send('Internal Server Error');
                        console.log(err);
                        return;
                    }
                    if(results.length == 0) {
                        setSettings();
                    }
                    else
                        res.status(400).send('Bad Request');
                });
            }
            else {
                setSettings();
            }
        }
        function setSettings() {
            const passwordHash = (request.passwordHash.length != 0) ? request.passwordHash : user.password_hash;
            updateUser(user.id, request.username, request.email, passwordHash, request.status, request.settings);
            if(user.password_hash != passwordHash)
                updateUserToken(user.id, createUserToken(request.username, request.passwordHash));
            res.status(200).send('OK');
        }
    });
});

main.post('/api/user/set-pfp', (req: Request, res: Response): void => {
    const request: SetPfpRequest = req.body;
    if(!isSetPfpRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
        if(request.pfpType != 'svg' && request.pfpType != 'png' && request.pfpType != 'jpg' &&
            request.pfpType != 'jpeg' && request.pfpType != 'gif') {
            res.status(400).send('Bad Request');
            return;
        }
        const base64: string | undefined = request.pfp.split(';base64,').pop();
        if(request.pfp.substring(0, 11) != 'data:image/' || base64 == undefined) {
            res.status(400).send('Bad Request');
            return;
        }
        fs.writeFile('./pfps/' + user.id + '.' + request.pfpType, base64, {encoding: 'base64'}, function(err) {
            if(err) {
                res.status(500).send('Internal Server Error');
                return;
            }
            updateUserPfpType(user.id, request.pfpType);
            if(user.pfp_type != request.pfpType) {
                fs.unlink('./pfps/' + user.id + '.' + user.pfp_type, (err) => {
                    if(err) res.status(500).send('Internal Server Error');
                    else res.status(200).send('OK');
                });
            }
            else
                res.status(200).send('OK');
        });
    });
});

// chat //

main.post('/api/chat/create', (req: Request, res: Response): void => {
    const request: CreateRequest = req.body;
    if(!isCreateRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
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
    validateToken(request.id, request.token, res, (user: any): void => {
        res.status(200).send({chats: JSON.parse(user.chats)});
    });
});

main.post('/api/chat/info', (req: Request, res: Response): void => {
    const request: ChatInfoRequest = req.body;
    if(!isChatInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateToken(request.id, request.token, res, (user: any): void => {
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
    validateToken(request.id, request.token, res, (user: any): void => {
        const chats = JSON.parse(user.chats);
        if(user.chats[request.chatId] != undefined) {
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
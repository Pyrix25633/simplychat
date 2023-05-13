import express, { Express, Request, Response } from 'express';
import { FieldInfo, MysqlError } from 'mysql';
import { ConfirmRequest, ConfirmResponse, EmailFeedbackResponse, RegisterRequest, UsernameFeedbackResponse, ValidateTokenRequest, ValidateTokenResponse, isConfirmRequestValid, isEmailFeedbackRequestValid, isRegisterRequestValid, isUsernameFeedbackRequestValid, isValidateTokenRequestValid } from './lib/types/api/User';
import { insertTempUser, query, selectTempUser, selectTempUserFromEmail, selectUserFromEmail, selectUserFromUsername } from './lib/database';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';
import { sendEmail } from './lib/email';
import Mail from 'nodemailer/lib/mailer';

const main: Express = express();
const port: number = 4443;

main.use(bodyParser.urlencoded({extended: true}));
main.use(bodyParser.json());
main.use(cors());
main.use(helmet());
main.use(helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
        "default-src": ["'self'"],
        "base-uri": "'self'",
        "font-src": ["'self'", "https:"],
        "frame-ancestors": ["'self'"],
        "img-src": ["'self'"],
        "object-src": ["'none'"],
        "script-src": ["'self'", "https:"],
        "script-src-attr": "'none'",
        "style-src": ["'self'", "https:", "data:"],
    }
}));
main.use('/css', express.static('./pages/css'));
main.use('/js', express.static('./pages/js'));
main.use('/img', express.static('./pages/img'));

//// api ////

// user //

main.post('/api/user/register', (req: Request, res: Response): void => {
    const request: RegisterRequest = req.body;
    if(!isRegisterRequestValid(request)) { // TODO
        res.status(400).send('Bad Request');
        return;
    }
    if(request.username.length < 4 || request.username.length > 32) {
        res.status(400).send('Bad Request');
        return;
    };
    for(let i = 0; i < request.username.length; i++) {
        let c = request.username.codePointAt(i);
        if((c == undefined) || !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
            res.status(400).send('Bad Request');
            return;
        }
    }
    selectTempUser(request.username, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Sever Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            selectUserFromUsername(request.username, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Sever Error');
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
                            '.<br> Click <a href="https://simplychat.ddns.net:4443/confirm?username="' + request.username +
                            '&verificationCode=' + verificationCode + '>here</a> to confirm your registration.' +
                            '<br> If the link above does not work open this <a href="https://simplychat.ddns.net:4443/confirm">' +
                            'page</a> and enter username and verification code.'
                    };
                    sendEmail(mailOptions, (err: Error | null): void => {
                        if(err) {
                            res.status(500).send('Internal Server Error');
                            console.log(err);
                            return;
                        }
                        insertTempUser(request, verificationCode, Date.now() / 1000, (err: MysqlError | null): void => {
                            if(err) {
                                res.status(500).send('Internal Server Error');
                                console.log(err);
                                return;
                            }
                            res.status(201).send("Created");
                        });
                    });
                }
                else
                    res.status(400).send('Bad Request');
            });
        else
            res.status(400).send('Bad Request');
    });
});

main.get('/api/user/username-feedback', (req: Request, res: Response): void => {
    let request: any = req.query.username;
    if(!isUsernameFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: UsernameFeedbackResponse = {feedback: null};
    if(request.length < 4) response.feedback = 'Username too short!';
    else if(request.length > 32) response.feedback = 'Username too long!';
    else {
        for(let i = 0; i < request.length; i++) {
            let c = request.codePointAt(i);
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
    selectTempUser(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Sever Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            selectUserFromUsername(request, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Sever Error');
                    console.log(err);
                    return;
                }
                if(results.length == 0)
                    res.status(200).send({feedback: 'Valid username'});
                else
                    res.status(200).send({feedback: 'Username already taken!'});
            });
        else
            res.status(200).send({feedback: 'Username already taken!'});
    });
});

main.get('/api/user/email-feedback', (req: Request, res: Response): void => {
    let request: any = req.query.email;
    if(!isEmailFeedbackRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    if(!request.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        res.status(200).send({feedback: 'Invalid email!'});
        return;
    }
    selectTempUserFromEmail(request, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Sever Error');
            console.log(err);
            return;
        }
        if(results.length == 0)
            selectUserFromEmail(request, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Sever Error');
                    console.log(err);
                    return;
                }
                if(results.length == 0)
                    res.status(200).send({feedback: 'Valid email'});
                else
                    res.status(200).send({feedback: 'Email already used!'});
            });
        else
            res.status(200).send({feedback: 'Email already used!'});
    });
});

main.post('/api/user/confirm', (req: Request, res: Response): void => {
    let request: ConfirmRequest = req.body;
    if(!isConfirmRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    selectTempUser(request.username, (err: MysqlError | null, results: any): void => {
        if(err) {
            res.status(500).send('Internal Sever Error');
            console.log(err);
            return;
        }
        if(results.length == 0) {
            res.status(404).send('Not Found');
            return;
        }
        console.log(request);
        console.log(results);
    });
    let response: ConfirmResponse; //TODO
});

main.post('/api/user/validate-token', (req: Request, res: Response): void => {
    let request: ValidateTokenRequest = req.body;
    if(!isValidateTokenRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: ValidateTokenResponse; //TODO
});

//// pages ////

main.get('/register', (req: Request, res: Response): void => {
    res.sendFile(path.resolve(__dirname, './pages/register.html'));
});

const options = {
    key: fs.readFileSync(path.resolve(__dirname, './certs/privateKey.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './certs/certificate.pem'))
};

https.createServer(options, main).listen(port, () => {
    console.log('Server listening on port ' + port);
});
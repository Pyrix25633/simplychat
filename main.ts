import express, { Express, Request, Response } from 'express';
import { FieldInfo, MysqlError } from 'mysql';
import { ConfirmRequest, ConfirmResponse, RegisterRequest, ValidateEmailResponse, ValidateTokenRequest, ValidateTokenResponse, ValidateUsernameResponse, isConfirmRequestValid, isRegisterRequestValid, isValidateEmailRequestValid, isValidateTokenRequestValid, isValidateUsernameRequestValid } from './lib/types/api/User';
import { insertTempUser, query, selectTempUser } from './lib/database';
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
    if(!isRegisterRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    const verificationCode: number = Math.floor(100000 + Math.random() * 900000);
    const mailOptions: Mail.Options = {
        to: request.email,
        subject: 'Simply Chat verification code',
        text: 'Your verification code is ' + verificationCode
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
});

main.get('/api/user/validate-username', (req: Request, res: Response): void => {
    let request: any = req.query.username;
    if(!isValidateUsernameRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: ValidateUsernameResponse = {valid: request.length > 4 && request.length <= 32}; // TODO
    res.status(200).send(response);
});

main.get('/api/user/validate-email', (req: Request, res: Response): void => {
    let request: any = req.query.email;
    if(!isValidateEmailRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: ValidateEmailResponse = {valid: false}; // TODO
    res.status(200).send(response);
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
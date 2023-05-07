import express, {Express, Request, Response} from 'express';
import {FieldInfo, MysqlError} from 'mysql';
import {ConfirmRequest, ConfirmResponse, RegisterRequest, RegisterResponse, ValidateEmailResponse, ValidateTokenRequest, ValidateTokenResponse, ValidateUsernameResponse, isConfirmRequestValid, isRegisterRequestValid, isValidateEmailRequestValid, isValidateTokenRequestValid, isValidateUsernameRequestValid} from './api/user/userTypes';
import {query} from './database';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import cors from 'cors';
import * as https from 'https';
import * as fs from 'fs';

const main: Express = express();
const port: number = 4443;

main.use(bodyParser.urlencoded({extended: false}));
main.use(bodyParser.json());
main.use(cors());
main.use(helmet());

//// api ////

// user //

main.post('/api/user/register', (req: Request, res: Response): void => {
    let request: RegisterRequest = req.body;
    if(!isRegisterRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    let response: RegisterResponse;
    // TODO
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

main.get('/api/user/confirm', (req: Request, res: Response): void => {
    let request: ConfirmRequest = req.body;
    if(!isConfirmRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
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

const options = {
    key: fs.readFileSync(path.resolve(__dirname, './certs/privateKey.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './certs/certificate.pem'))
};

https.createServer(options, main).listen(port, () => {
    console.log('Server listening on port ' + port);
});
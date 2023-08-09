import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { sendEmail } from '../../email';
import Mail from 'nodemailer/lib/mailer';
import { ConfirmRequest, RegisterRequest, UsernameFeedbackResponse, isConfirmRequestValid, isEmailFeedbackRequestValid, isRegisterRequestValid, isUsernameConfirmFeedbackRequestValid, isUsernameFeedbackRequestValid } from "../../types/api/user";
import { createUser, deleteTempUser, insertTempUser, selectFromEmail, selectFromUsername, selectFromUsernameOrEmail, selectTempUser, selectUserFromUsername } from '../../database';
import { createUserToken } from '../../hash';
import { generateRandomPfp } from '../../random-image';

export function register(req: Request, res: Response): void {
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
}

export function usernameFeedback(req: Request, res: Response): void {
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
}

export function emailFeedback(req: Request, res: Response): void {
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
}

export function confirm(req: Request, res: Response): void {
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
}

export function usernameConfirmFeedback(req: Request, res: Response): void {
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
}
import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import * as tfa from 'speakeasy';
import * as qrcode from 'qrcode';
import { getTimestamp, oneDayTimestamp } from '../../timestamp';
import { createTfaToken, createUserToken } from '../../hash';
import { selectUser, selectUserFromUsername, selectUserToken, updateUserToken } from '../../database';
import { LoginRequest, RegenerateTokenRequest, TfauthenticateRequest, ValidateTokenRequest, VerifyTfaCodeRequest, exitIfDeletedUser, isLoginRequestValid, isRegenerateTokenRequestValid, isTfautheticateRequestValid, isUsernameFeedbackRequestValid, isValidateTokenRequestValid, isVerifyTfaCodeRequestValid } from '../../types/api/user';
import { sendEmail } from '../../email';

const pendingTfa: Map<number, string> = new Map<number, string>();

function updateUserTokenIfExpiringSoon(user: any, res: Response): boolean {
    if(user.token_expiration - oneDayTimestamp < getTimestamp()) {
        const token = createUserToken(user.username, user.password_hash);
        res.status(200).send({id: user.id, token: token, pendingTfa: false});
        updateUserToken(user.id, token, user.token_duration);
        return true;
    }
    return false;
}

export function login(req: Request, res: Response): void {
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
        if(exitIfDeletedUser(user, res)) return;
        if(user.password_hash != request.passwordHash) {
            console.log(request, user);
            res.status(401).send('Unauthorized');
            return;
        }
        if(user.tfa_key != null) {
            const tfaToken = createTfaToken(request.username, user.id);
            pendingTfa.set(user.id, tfaToken);
            res.status(200).send({id: user.id, pendingTfa: true, tfaToken: tfaToken});
            return;
        }
        if(updateUserTokenIfExpiringSoon(user, res)) return;
        res.status(200).send({id: user.id, token: user.token, pendingTfa: false});
        sendEmail({
            to: user.email,
            subject: 'Simply Chat security notification',
            text: 'A new login to your Simply Chat account (' + user.username + ') has been detected!\n' +
                'If it was you, you don\'t need to do anything. If not, you should take action.\n' +
                'Either way we suggest you to activate Two Factor Authentication!\n' +
                'User-agent: ' + req.headers['user-agent'] + '\nIP address: ' + req.ip
        });
    });
}

export function usernameLoginFeedback(req: Request, res: Response): void {
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
}

export function tfauthenticate(req: Request, res: Response): void {
    const request: TfauthenticateRequest = req.body;
    if(!isTfautheticateRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    if(pendingTfa.get(request.id) != request.tfaToken) {
        res.status(403).send('Forbidden');
        return;
    }
    selectUser(request.id, (err: MysqlError | null, results: any): void => {
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
        if(exitIfDeletedUser(user, res)) return;
        if(!tfa.totp.verify({secret: user.tfa_key, encoding: 'base32', token: request.tfaCode, window: 2})) {
            res.status(401).send('Unauthorized');
            return;
        }
        pendingTfa.delete(user.id);
        if(updateUserTokenIfExpiringSoon(user, res)) return;
        res.status(200).send({id: user.id, token: user.token});
        sendEmail({
            to: user.email,
            subject: 'Simply Chat security notification',
            text: 'A new login to your Simply Chat account (' + user.username + ') has been detected!\n' +
                'If it was you, you don\'t need to do anything. If not, you should take action.\n' +
                'Two Factor Authentication is already active!\n' +
                'User-agent: ' + req.headers['user-agent'] + '\nIP address: ' + req.ip
        });
    });
}

export function validateToken(req: Request, res: Response): void {
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
}

export function validateTokenAndProceed(id: number, token: string, res: Response, callback: (user: any) => void): void {
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
        if(exitIfDeletedUser(user, res)) return;
        if(user.token == token && user.token_expiration > getTimestamp())
            callback(user);
        else
            res.status(401).send('Unauthorized');
    });
}

export function regenerateToken(req: Request, res: Response): void {
    const request: RegenerateTokenRequest = req.body;
    if(!isRegenerateTokenRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        const token = createUserToken(user.username, user.password_hash);
        res.status(200).send('OK');
        updateUserToken(user.id, token, user.token_duration);
    });
}

export function generateTfaKey(req: Request, res: Response): void {
    const tfaKey: string = tfa.generateSecret().base32;
    qrcode.toString('otpauth://totp/SimplyChat?secret=' + tfaKey, {type: 'svg'}, (err: Error | null | undefined, string: string): void => {
        if(err) {
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send({
            tfaKey: tfaKey,
            tfaQr: string
        });
    });
}

export function verifyTfaCode(req: Request, res: Response): void {
    const request: VerifyTfaCodeRequest = req.body;
    if(!isVerifyTfaCodeRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    res.status(200).send({
        valid: tfa.totp.verify({secret: request.tfaKey, encoding: 'base32', token: request.tfaCode, window: 2})
    });
}
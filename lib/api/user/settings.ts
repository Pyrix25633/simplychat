import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import imageSize from 'image-size';
import * as fs from 'fs';
import { GetSettingsRequest, SetPfpRequest, SetSettingsRequest, isGetSettingsRequestValid, isSetPfpRequestValid, isSetSettingsRequestValid } from '../../types/api/user';
import { validateTokenAndProceed } from './authentication';
import { selectFromEmail, selectFromUsername, updateUser, updateUserPfpType, updateUserToken } from '../../database';
import { createUserToken } from '../../hash';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { sendEmail } from '../../email';

export function getSettings(req: Request, res: Response): void {
    const request: GetSettingsRequest = req.body;
    if(!isGetSettingsRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        res.status(200).send({
            username: user.username,
            email: user.email,
            status: user.status,
            tokenExpiration: user.token_expiration,
            tokenDuration: user.token_duration,
            tfaActive: user.tfa_key != null,
            settings: JSON.parse(user.settings),
            pfpType: user.pfp_type
        });
    });
}

export function setSettings(req: Request, res: Response): void {
    const request: SetSettingsRequest = req.body;
    if(!isSetSettingsRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        if(user.password_hash != request.oldPasswordHash) {
            res.status(401).send('Forbidden');
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
            const tfaKey = (request.tfaActive ? (request.tfaKey == null ? user.tfa_key : request.tfaKey) : null);
            updateUser(user.id, request.username, request.email, passwordHash, request.tokenDuration, tfaKey, request.status, request.settings);
            if(user.password_hash != passwordHash)
                updateUserToken(user.id, createUserToken(request.username, request.passwordHash), request.tokenDuration);
            res.status(200).send('OK');
            sendEmail({
                to: user.email,
                subject: 'Simply Chat security notification',
                text: 'Your account (' + user.username + ') settings have been modified!\n' +
                    'If it was you, you don\'t need to do anything. If not, you should take action.\n' +
                    'User-agent: ' + req.headers['user-agent'] + '\nIP address: ' + req.ip
            });
        }
    });
}

export function setPfp(req: Request, res: Response): void {
    const request: SetPfpRequest = req.body;
    if(!isSetPfpRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
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
        const dimensions: ISizeCalculationResult = imageSize(Buffer.from(base64, 'base64'));
        if(dimensions.width != dimensions.height || dimensions.width == undefined || dimensions.width < 512 || dimensions.width > 2048) {
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
}
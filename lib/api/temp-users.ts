import { Request, Response } from "express";
import { Created, Ok, handleException } from "../web/response";
import { getEmail } from "../validation/semantic-validation";
import { getNonEmptyString, getObject, getString } from "../validation/type-validation";
import { generateVerificationCode } from "../random";
import { createTempUser, isTempUserEmailInUse, isTempUserUsernameInUse } from "../database/temp-user";
import { sendEmail } from "../email";
import { settings } from "../settings";
import { isUserEmailInUse, isUserUsernameInUse } from "../database/user";

export async function getRegisterUsernameFeedback(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        let feedback;
        try {
            const username = getNonEmptyString(body.username);
            const inUse = (await isTempUserUsernameInUse(username)) || (await isUserUsernameInUse(username));
            feedback = inUse ? 'Username already taken!' : 'Valid Username';
        } catch(e: any) {
            const username = getString(body.username);
            if(username.length < 3)
                feedback = 'Username too short!';
            else if(username.length > 32)
                feedback = 'Username too long!';
            else
                feedback = 'Username contains forbidden Character!';
        }
        new Ok({feedback: feedback}).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getRegisterEmailFeedback(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        let feedback;
        try {
            const email = getNonEmptyString(body.email);
            const inUse = (await isTempUserEmailInUse(email)) || (await isUserEmailInUse(email));
            feedback = inUse ? 'Email already used' : 'Valid Email';
        } catch(e: any) {
            feedback = 'Invalid Email!';
        }
        new Ok({feedback: feedback}).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function postTempUser(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body;
        const username = getNonEmptyString(body.username);
        const email = getEmail(body.email);
        const password = getNonEmptyString(body.password);
        const verificationCode = generateVerificationCode();
        const tempUser = await createTempUser(username, email, password, verificationCode);
        sendEmail({
            to: email,
            subject: 'Simply Chat Verification Code',
            text: 'Your Verification Code for Username ' + tempUser.username + ' is ' + tempUser.verificationCode + '.',
            html: 'Your Verification Code for Username ' + tempUser.username + ' is ' + tempUser.verificationCode + '.<br>' +
                'Click <a href="' + settings.https.hostname + '/temp-users/' + tempUser.username + '/confirm?verificationCode=' + verificationCode +
                '">here</a> to confirm your Registration or open <a href="' + settings.https.hostname +
                '/confirm">this Link</a> and enter Username and Verification Code.'
        });
        new Created({username: tempUser.username}).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
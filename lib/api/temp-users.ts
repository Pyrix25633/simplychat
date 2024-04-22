import { Request, Response } from "express";
import { Created, UnprocessableContent, handleException } from "../web/response";
import { getEmail, getSixDigitCode, getUsername } from "../validation/semantic-validation";
import { getNonEmptyString, getObject } from "../validation/type-validation";
import { generateVerificationCode } from "../random";
import { createTempUser, deleteTempUser, findTempUser } from "../database/temp-user";
import { sendEmail } from "../email";
import { settings } from "../settings";
import { createUserFromTempUser } from "../database/user";

export async function postTempUser(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const username = getUsername(body.username);
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

export async function postTempUserConfirm(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const username = getUsername(req.params.username);
        const verificationCode = getSixDigitCode(body.verificationCode);
        const tempUser = await findTempUser(username);
        if(verificationCode != tempUser.verificationCode)
            throw new UnprocessableContent();
        const user = await createUserFromTempUser(tempUser);
        await deleteTempUser(tempUser.username);
        new Created({ userId: user.id }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
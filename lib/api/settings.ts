import { Request, Response } from "express";
import { Forbidden, NoContent, Ok, handleException } from "../web/response";
import { validateToken } from "./auth";
import { findUser, findUserTokenAndPasswordHash, updateUserPassword, updateUserPfp, updateUserSettings, updateUserTfaKey } from "../database/user";
import { getNonEmptyString, getObject, getOrNull, getOrUndefined } from "../validation/type-validation";
import { getBase64EncodedImage, getEmail, getSettings as getSettings_SemanticValidation, getSixDigitCode, getStatus, getTfaKey, getTokenDuration, getUsername } from "../validation/semantic-validation";
import bcrypt from "bcrypt";

export async function getSettings(req: Request, res: Response): Promise<void> {
    try {
        const user = await validateToken(req, findUser);
        new Ok({
            id: user.id,
            username: user.username,
            email: user.email,
            status: user.status,
            settings: user.settings,
            pfp: user.pfp,
            tokenDuration: user.tokenDuration,
            tfa: user.tfaKey != null
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function patchSettings(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req, findUserTokenAndPasswordHash);
        const body = getObject(req.body);
        const username = getUsername(body.username);
        const email = getEmail(body.email);
        const status = getStatus(body.status);
        const settings = getSettings_SemanticValidation(body.settings);
        const password = getOrUndefined(body.password, getNonEmptyString);
        const oldPassword = getNonEmptyString(body.oldPassword);
        if(!bcrypt.compareSync(oldPassword, partialUser.passwordHash))
            throw new Forbidden();
        const pfp = getOrUndefined(body.pfp, getBase64EncodedImage);
        const tokenDuration = getTokenDuration(body.tokenDuration);
        const tfaKey = getOrUndefined(body.tfaKey, (raw: any) => { return getOrNull(raw, getTfaKey); });
        await updateUserSettings(partialUser.id, username, email, status, settings, tokenDuration);
        if(password != undefined)
            await updateUserPassword(partialUser.id, password);
        if(pfp != undefined)
            await updateUserPfp(partialUser.id, pfp);
        if(tfaKey !== undefined)
            await updateUserTfaKey(partialUser.id, tfaKey);
        new NoContent().send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
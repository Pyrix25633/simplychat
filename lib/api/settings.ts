import { Request, Response } from "express";
import { Ok, handleException } from "../web/response";
import { validateToken } from "./auth";
import { findUser } from "../database/user";
import { getBoolean, getObject, getOrUndefined } from "../validation/type-validation";
import { getBase64EncodedImage, getEmail, getSettings as getSettingsSV, getStatus, getTfaKey, getTokenDuration, getUsername } from "../validation/semantic-validation";

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
        const body = getObject(req.body);
        const username = getUsername(body.username);
        const email = getEmail(body.email);
        const status = getStatus(body.status);
        const settings = getSettingsSV(body.settings);
        const pfp = getOrUndefined(body.pfp, getBase64EncodedImage);
        const tokenDuration = getTokenDuration(body.tokenDuration);
        const tfa = getBoolean(body.tfa);
        const tfaKey = getOrUndefined(body.tfaKey, getTfaKey);
        //TODO: finish patch
    } catch(e: any) {
        handleException(e, res);
    }
}
import { Request, Response } from "express";
import { NoContent, NotFound, Ok, Unauthorized, UnprocessableContent, handleException } from "../web/response";
import { getNonEmptyString, getObject } from "../validation/type-validation";
import { getSixDigitCode, getTfaKey, getToken, getUsername } from "../validation/semantic-validation";
import bcrypt from "bcrypt";
import { findUser, findUserToken, findUserTokenAndUsername, findUserWhereUsername, regenerateUserToken } from "../database/user";
import { encodeSvgToBase64, generateTfaToken } from "../random";
import { settings } from "../settings";
import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import tfa from "speakeasy";
import qrcode from "qrcode";
import { AuthTokenPayload, FindFunction, validateJsonWebToken } from "../auth";

const pendingTfas: { [index: string]: number; } = {};

function authenticate(user: User, res: Response): void {
    const payload: AuthTokenPayload = {
        userId: user.id,
        token: user.token
    };
    const authToken = jwt.sign(payload, settings.jwt.password, {
        algorithm: settings.jwt.algorithm as unknown as jwt.Algorithm,
        expiresIn: user.sessionDuration + 'd'
    });
    res.cookie(settings.jwt.cookieName, authToken, {
        expires: new Date(Date.now() + (user.sessionDuration * 24 * 60 * 60 * 1000)),
        sameSite: 'strict'
    });
    new NoContent().send(res);
}

export async function getValidateToken(req: Request, res: Response): Promise<void> {
    let valid: boolean;
    try {
        await validateToken(req);
        valid = true;
    }
    catch(e: any) {
        valid = false;
    }
    new Ok({ valid: valid }).send(res);
}

export async function postLogin(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const username = getUsername(body.username);
        const password = getNonEmptyString(body.password);
        const user = await findUserWhereUsername(username);
        if(!bcrypt.compareSync(password, user.passwordHash))
            throw new Unauthorized();
        if(user.tfaKey != null) {
            const tfaToken = generateTfaToken(user.id, pendingTfas);
            pendingTfas[tfaToken] = user.id;
            new Ok({ tfaToken: tfaToken }).send(res);
        }
        else
            authenticate(user, res);
    } catch(e: any) {
        handleException(e, res);
    }
}

function verify(key: string, code: number): boolean {
    return tfa.totp.verify({
        secret: key,
        encoding: 'base32',
        token: code.toString(),
        algorithm: settings.tfa.algorithm as tfa.Algorithm,
        window: 2
    });
}

export async function postLoginTfa(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const tfaToken = getToken(body.tfaToken);
        const tfaCode = getSixDigitCode(body.tfaCode);
        const userId = pendingTfas[tfaToken];
        if(userId == undefined)
            throw new NotFound();
        const user = await findUser(userId);
        if(user.tfaKey == null)
            throw new UnprocessableContent();
        if(!verify(user.tfaKey, tfaCode))
            throw new Unauthorized();
        authenticate(user, res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function validateToken<T extends { token: string; }>(req: Request, findFunction: FindFunction<T> = findUserToken as FindFunction<T>): Promise<T & { id: number; sessionExpiration: number; }> {
    const authToken: string | undefined = req.cookies[settings.jwt.cookieName];
    if(authToken == undefined)
        throw new Unauthorized();
    try {
        return await validateJsonWebToken(authToken, findFunction);
    } catch(e: any) {
        throw new Unauthorized();
    }
}

export async function getTfaGenerateKey(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req, findUserTokenAndUsername);
        const tfaKey = tfa.generateSecret().base32;
        const tfaQr = await qrcode.toString(
            'otpauth://totp/' + partialUser.username + '?secret=' + tfaKey + '&issuer=SimplyChat&algorithm=' + settings.tfa.algorithm,
            { type: 'svg' }
        );
        new Ok({
            tfaKey: tfaKey,
            tfaQr: encodeSvgToBase64(tfaQr.replace('#ffffff', '#dddddd').replace('#000000', '#222222'))
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getTfaValidateCode(req: Request, res: Response): Promise<void> {
    try {
        const tfaKey = getTfaKey(req.query.tfaKey);
        const tfaCode = getSixDigitCode(req.query.tfaCode);
        new Ok({
            valid: verify(tfaKey, tfaCode)
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function postLogout(req: Request, res: Response): Promise<void> {
    res.cookie(settings.jwt.cookieName, '', {
        expires: new Date(0)
    });
    new NoContent().send(res);
}

export async function postRegenerateToken(req: Request, res: Response): Promise<void> {
    try {
        const user = await validateToken(req, findUser);
        await regenerateUserToken(user);
        res.cookie(settings.jwt.cookieName, '', {
            expires: new Date(0)
        });
        new NoContent().send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
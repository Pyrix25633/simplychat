import { Request, Response } from "express";
import { NoContent, NotFound, Ok, Unauthorized, UnprocessableContent, handleException } from "../web/response";
import { getNonEmptyString, getObject } from "../validation/type-validation";
import { getSixDigitCode, getTfaToken, getUsername } from "../validation/semantic-validation";
import bcrypt from "bcrypt";
import { findUser, findUserWhereUsername } from "../database/user";
import { generateTfaToken } from "../random";
import { settings } from "../settings";
import { User } from "@prisma/client";
import jwt, { Algorithm } from "jsonwebtoken";
import tfa from "speakeasy";
import { prisma } from "../database/prisma";

const pendingTfas: { [index: string]: number; } = {};

type AuthTokenPayload = {
    userId: number;
    token: string;
};

function authenticate(user: User, res: Response): void {
    const payload: AuthTokenPayload = {
        userId: user.id,
        token: user.token
    };
    const authToken = jwt.sign(payload, settings.jwt.password, {
        algorithm: settings.jwt.algorithm as unknown as Algorithm,
        expiresIn: user.tokenDuration + 'd'
    });
    res.cookie(settings.jwt.cookieName, authToken, {
        expires: new Date(Date.now() + (user.tokenDuration * 24 * 60 * 60 * 1000)),
        sameSite: "strict"
    });
    new NoContent().send(res);
}

export async function getValidateToken(req: Request, res: Response): Promise<void> {
    let valid: boolean;
    try {
        validateToken(req);
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

export async function postLoginTfa(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const tfaToken = getTfaToken(body.tfaToken);
        const tfaCode = getSixDigitCode(body.tfaCode);
        const userId = pendingTfas[tfaToken];
        if(userId == undefined)
            throw new NotFound();
        const user = await findUser(userId);
        if(user.tfaKey == null)
            throw new UnprocessableContent();
        if(!tfa.totp.verify({ secret: user.tfaKey, encoding: 'base32', token: tfaCode.toString(), window: 2 }))
            throw new Unauthorized();
        authenticate(user, res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function validateToken(req: Request): Promise<number> {
    const authToken: string = req.cookies[settings.jwt.cookieName];
    try {
        const payload = jwt.verify(authToken, settings.jwt.password) as AuthTokenPayload;
        const partialUser = await prisma.user.findUnique({
            select: {
                token: true
            },
            where: {
                id: payload.userId
            }
        });
        if(partialUser == null)
            throw new Unauthorized();
        if(payload.token != partialUser.token)
            throw new Unauthorized();
        return payload.userId;
    } catch(e: any) {
        throw new Unauthorized();
    }
}
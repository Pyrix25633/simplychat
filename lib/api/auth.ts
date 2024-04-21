import { Request, Response } from "express";
import { Ok, Unauthorized, handleException } from "../web/response";
import { getNonEmptyString, getObject } from "../validation/type-validation";
import { getUsername } from "../validation/semantic-validation";
import * as bcrypt from "bcrypt";
import { findUserWhereUsername } from "../database/user";
import { generateTfaToken } from "../random";

const authCookieName = 'simplychat-auth';
const pendingTfas: { [index: string]: number; } = {};

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
        else {
            res.setHeader('Set-cookie', authCookieName + '='); //TODO: finish and document login
        }
    } catch(e: any) {
        handleException(e, res);
    }
}
import { Request, Response } from "express";
import { prisma } from "../database/prisma";
import { createTempUser, deleteTempUser, findTempUser } from "../database/temp-user";
import { createUserFromTempUser } from "../database/user";
import { sendVerificationCode } from "../email";
import { generateVerificationCode } from "../random";
import { getEmail, getSixDigitCode, getUsername } from "../validation/semantic-validation";
import { getNonEmptyString, getObject } from "../validation/type-validation";
import { Created, UnprocessableContent, handleException } from "../web/response";

export async function postTempUser(req: Request, res: Response): Promise<void> {
    try {
        const body = getObject(req.body);
        const username = getUsername(body.username);
        const email = getEmail(body.email);
        const password = getNonEmptyString(body.password);
        const verificationCode = generateVerificationCode();
        const tempUser = await createTempUser(username, email, password, verificationCode);
        sendVerificationCode(email, tempUser);
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
        await prisma.$transaction(async (): Promise<void> => {
            try {
                const user = await createUserFromTempUser(tempUser);
                await deleteTempUser(tempUser.username);
                new Created({ userId: user.id }).send(res);
            } catch(e: any) {
                throw e;
            }
        });
    } catch(e: any) {
        handleException(e, res);
    }
}
import { TempUser } from "@prisma/client";
import { prisma } from "./prisma";
import { UnprocessableContent } from "../web/response";

export async function isTempUserUsernameInUse(username: string): Promise<boolean> {
    return (await prisma.tempUser.findMany({
        where: {
            username: username
        }
    })).length != 0;
}

export async function isTempUserEmailInUse(email: string): Promise<boolean> {
    return (await prisma.tempUser.findMany({
        where: {
            email: email
        }
    })).length != 0;
}

export async function createTempUser(username: string, email: string, passwordHash: string, verificationCode: number): Promise<TempUser> {
    try {
        return await prisma.tempUser.create({
            data: {
                username,
                email,
                passwordHash,
                verificationCode
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}
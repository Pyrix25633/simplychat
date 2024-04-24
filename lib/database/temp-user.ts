import { TempUser } from "@prisma/client";
import { prisma } from "./prisma";
import { NotFound, UnprocessableContent } from "../web/response";
import * as bcrypt from "bcrypt";
import { settings } from "../settings";

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

export async function createTempUser(username: string, email: string, password: string, verificationCode: number): Promise<TempUser> {
    try {
        return await prisma.tempUser.create({
            data: {
                username: username,
                email: email,
                passwordHash: bcrypt.hashSync(password, settings.bcrypt.rounds),
                verificationCode: verificationCode
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function findTempUser(username: string): Promise<TempUser> {
    const tempUser: TempUser | null = await prisma.tempUser.findUnique({
        where: {
            username: username
        }
    });
    if(tempUser == null)
        throw new NotFound();
    return tempUser;
}

export async function deleteTempUser(username: string): Promise<void> {
    await prisma.tempUser.delete({
        where: {
            username: username
        }
    });
}
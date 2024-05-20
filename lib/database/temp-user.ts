import { TempUser } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { settings } from "../settings";
import { NotFound, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function isTempUserUsernameInUse(username: string): Promise<boolean> {
    return (await prisma.tempUser.count({
        where: {
            username: username
        }
    })) != 0;
}

export async function isTempUserEmailInUse(email: string): Promise<boolean> {
    return (await prisma.tempUser.count({
        where: {
            email: email
        }
    })) != 0;
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

export async function deleteTempUser(username: string): Promise<TempUser> {
    return prisma.tempUser.delete({
        where: {
            username: username
        }
    });
}
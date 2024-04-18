import { prisma } from "./prisma";

export async function isUserUsernameInUse(username: string): Promise<boolean> {
    return (await prisma.user.findMany({
        where: {
            username: username
        }
    })).length != 0;
}

export async function isUserEmailInUse(email: string): Promise<boolean> {
    return (await prisma.user.findMany({
        where: {
            email: email
        }
    })).length != 0;
}
import { PrismaClient, User } from "@prisma/client";
import { settings } from "../settings";
import { generatePfp, generateUserToken } from "../random";

export const prisma = new PrismaClient();

export const simplychat: Promise<User> = prisma.user.upsert({
    where: {
        username: settings.simplychatUser.username
    },
    update: {},
    create: {
        username: settings.simplychatUser.username,
        email: settings.nodemailerTransport.auth.user,
        status: settings.simplychatUser.username,
        customization: {
            compactMode: false,
            condensedFont: false,
            aurebeshFont: false,
            sharpMode: false
        },
        passwordHash: settings.simplychatUser.passwordHash,
        token: generateUserToken(settings.simplychatUser.username, settings.nodemailerTransport.auth.user, settings.simplychatUser.passwordHash),
        pfp: Buffer.from(generatePfp())
    }
});
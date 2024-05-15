import { TempUser, User } from "@prisma/client";
import { prisma } from "./prisma";
import { NotFound, UnprocessableContent } from "../web/response";
import { generatePfp, generateUserToken } from "../random";
import * as bcrypt from "bcrypt";
import { settings } from "../settings";

export async function createUserFromTempUser(tempUser: TempUser): Promise<User> {
    try {
        return await prisma.user.create({
            data: {
                username: tempUser.username,
                email: tempUser.email,
                status: 'Just joined Simply Chat!',
                customization: {
                    compactMode: false,
                    condensedFont: false,
                    aurebeshFont: false,
                    sharpMode: false
                },
                passwordHash: tempUser.passwordHash,
                token: generateUserToken(tempUser.username, tempUser.email, tempUser.passwordHash),
                pfp: Buffer.from(generatePfp())
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function isUserUsernameInUse(username: string): Promise<boolean> {
    return (await prisma.user.count({
        where: {
            username: username
        }
    })) != 0;
}

export async function isUserEmailInUse(email: string): Promise<boolean> {
    return (await prisma.user.count({
        where: {
            email: email
        }
    })) != 0;
}

export async function findUser(id: number): Promise<User> {
    const user: User | null = await prisma.user.findUnique({
        where: {
            id: id
        }
    });
    if(user == null)
        throw new NotFound();
    return user;
}

type UserInfo = {
    username: string;
    status: string;
    online: boolean;
    lastOnline: Date;
    pfp: Buffer;
};

export async function findUserInfo(id: number): Promise<UserInfo> {
    const userInfo: UserInfo | null = await prisma.user.findUnique({
        select: {
            username: true,
            status: true,
            online: true,
            lastOnline: true,
            pfp: true
        },
        where: {
            id: id
        }
    });
    if(userInfo == null)
        throw new NotFound();
    return userInfo;
}

export async function findUserWhereUsername(username: string): Promise<User> {
    const user: User | null = await prisma.user.findUnique({
        where: {
            username: username
        }
    });
    if(user == null)
        throw new NotFound();
    return user;
}

export async function findUserToken(id: number): Promise<{ token: string; }> {
    const partialUser = await prisma.user.findUnique({
        select: {
            token: true
        },
        where: {
            id: id
        }
    });
    if(partialUser == null)
        throw new NotFound();
    return partialUser;
}

export async function findUserTokenAndCustomization(id: number): Promise<{ token: string; customization: Customization }> {
    const partialUser = await prisma.user.findUnique({
        select: {
            token: true,
            customization: true
        },
        where: {
            id: id
        }
    });
    if(partialUser == null)
        throw new NotFound();
    return partialUser as { token: string; customization: Customization };
}

export async function findUserTokenAndPasswordHash(id: number): Promise<{ token: string; passwordHash: string; }> {
    const partialUser = await prisma.user.findUnique({
        select: {
            token: true,
            passwordHash: true
        },
        where: {
            id: id
        }
    });
    if(partialUser == null)
        throw new NotFound();
    return partialUser;
}

export async function findUserTokenAndUsername(id: number): Promise<{ token: string; username: string; }> {
    const partialUser = await prisma.user.findUnique({
        select: {
            token: true,
            username: true
        },
        where: {
            id: id
        }
    });
    if(partialUser == null)
        throw new NotFound();
    return partialUser;
}

export type Customization = {
    compactMode: boolean;
    condensedFont: boolean;
    aurebeshFont: boolean;
    sharpMode: boolean;
};

export async function updateUserSettings(id: number, username: string, email: string, status: string, customization: Customization, sessionDuration: number): Promise<User> {
    try {
        return prisma.user.update({
            data: {
                username: username,
                email: email,
                status: status,
                customization: customization,
                sessionDuration: sessionDuration
            },
            where: {
                id: id
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function updateUserPassword(id: number, password: string): Promise<User> {
    return prisma.user.update({
        data: {
            passwordHash: bcrypt.hashSync(password, settings.bcrypt.rounds)
        },
        where: {
            id: id
        }
    });
}

export async function updateUserPfp(id: number, pfp: Buffer): Promise<User> {
    return prisma.user.update({
        data: {
            pfp: pfp
        },
        where: {
            id: id
        }
    });
}

export async function updateUserTfaKey(id: number, tfaKey: string | null): Promise<User> {
    return prisma.user.update({
        data: {
            tfaKey: tfaKey
        },
        where: {
            id: id
        }
    });
}

export async function regenerateUserToken(user: User): Promise<User> {
    return prisma.user.update({
        data: {
            token: generateUserToken(user.username, user.email, user.passwordHash)
        },
        where: {
            id: user.id
        }
    });
}

export async function countUsers(): Promise<number> {
    return prisma.user.count();
}

export async function countOnlineUsers(): Promise<number> {
    return prisma.user.count({
        where: {
            online: true
        }
    });
}
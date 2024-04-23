import { TempUser, User } from "@prisma/client";
import { prisma } from "./prisma";
import { NotFound, UnprocessableContent } from "../web/response";
import { generatePfp, generateToken } from "../random";

export async function createUserFromTempUser(tempUser: TempUser): Promise<User> {
    try {
        return await prisma.user.create({
            data: {
                username: tempUser.username,
                email: tempUser.email,
                passwordHash: tempUser.passwordHash,
                token: generateToken(tempUser.username, tempUser.email, tempUser.passwordHash),
                status: 'Just joined Simply Chat!',
                settings: {
                    compactMode: false,
                    condensedFont: false,
                    aurebeshFont: false,
                    sharpMode: false
                },
                pfp: Buffer.from(generatePfp())
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

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
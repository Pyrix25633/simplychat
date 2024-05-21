import { Chat, PermissionLevel } from "@prisma/client";
import { generateChatLogo, generateChatToken } from "../random";
import { notifyAllUsersOnChat } from "../socket";
import { NotFound, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function createChat(name: string, description: string): Promise<Chat> {
    try {
        return await prisma.chat.create({
            data: {
                name: name,
                description: description,
                token: generateChatToken(name, description),
                logo: Buffer.from(generateChatLogo())
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function findChat(id: number): Promise<Chat> {
    const chat: Chat | null = await prisma.chat.findUnique({
        where: {
            id: id
        }
    });
    if(chat == null)
        throw new NotFound();
    return chat;
}

export async function updateChatToken(id: number, token: string): Promise<Chat> {
    try {
        return await prisma.chat.update({
            data: {
                token: token
            },
            where: {
                id: id
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function doesChatExist(id: number): Promise<boolean> {
    return await prisma.chat.findUnique({
        select: {
            id: true
        },
        where: {
            id: id
        }
    }) != null;
}

export async function updateChatSettings(id: number, name: string, description: string, tokenExpiration: Date | null, defaultPermissionLevel: PermissionLevel): Promise<Chat> {
    try {
        const chat = await prisma.chat.update({
            data: {
                name: name,
                description: description,
                tokenExpiration: tokenExpiration,
                defaultPermissionLevel: defaultPermissionLevel
            },
            where: {
                id: id
            }
        });
        notifyAllUsersOnChat(id, 'chat-name-description', {
            id: id,
            name: name,
            description: description
        });
        return chat;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function updateChatLogo(id: number, logo: Buffer): Promise<Chat> {
    try {
        const chat = await prisma.chat.update({
            data: {
                logo: logo
            },
            where: {
                id: id
            }
        });
        notifyAllUsersOnChat(id, 'chat-logo', {
            id: id,
            logo: logo.toString()
        });
        return chat;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function findChatInfo(id: number): Promise<{ name: string; description: string; logo: Buffer; }> {
    const partialChat = await prisma.chat.findUnique({
        select: {
            name: true,
            description: true,
            logo: true
        },
        where: {
            id: id
        }
    });
    if(partialChat == null)
        throw new NotFound();
    return partialChat;
}
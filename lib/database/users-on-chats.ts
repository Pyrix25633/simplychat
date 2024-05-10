import { PermissionLevel, UsersOnChats } from "@prisma/client";
import { UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function createUserOnChat(userId: number, chatId: number, permissionLevel: PermissionLevel): Promise<UsersOnChats> {
    try {
        return await prisma.usersOnChats.create({
            data: {
                userId: userId,
                chatId: chatId,
                permissionLevel: permissionLevel
            }
        });
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function countUsersOnChat(chatId: number): Promise<number> {
    return prisma.usersOnChats.count({
        where: {
            chatId: chatId
        }
    });
}

export async function isUserOnChatAdministrator(userId: number, chatId: number): Promise<boolean> {
    const partialUserOnChat: { permissionLevel: PermissionLevel; } | null = await prisma.usersOnChats.findUnique({
        select: {
            permissionLevel: true
        },
        where: {
            chatId_userId: {
                chatId: chatId,
                userId: userId
            }
        }
    });
    if(partialUserOnChat == null)
        return false;
    return partialUserOnChat.permissionLevel == PermissionLevel.ADMINISTRATOR;
}

export async function findUsersOnChat(chatId: number): Promise<{ userId: number; permissionLevel: PermissionLevel; }[]> {
    return prisma.usersOnChats.findMany({
        select: {
            userId: true,
            permissionLevel: true
        },
        where: {
            chatId: chatId
        }
    });
}
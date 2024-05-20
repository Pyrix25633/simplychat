import { PermissionLevel, UsersOnChats } from "@prisma/client";
import { notifyAllUsersOnChat } from "../socket";
import { NotFound, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function createUserOnChat(userId: number, chatId: number, permissionLevel: PermissionLevel): Promise<UsersOnChats> {
    try {
        const userOnChat = await prisma.usersOnChats.create({
            data: {
                userId: userId,
                chatId: chatId,
                permissionLevel: permissionLevel
            }
        });
        notifyAllUsersOnChat(chatId, 'chat-user-join', {
            chatId: chatId,
            userId: userId,
            permissionLevel: permissionLevel
        });
        return userOnChat;
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

export async function findUsersOnChatExcept(chatId: number, userId: number): Promise<{ userId: number; permissionLevel: PermissionLevel; }[]> {
    return prisma.usersOnChats.findMany({
        select: {
            userId: true,
            permissionLevel: true
        },
        where: {
            chatId: chatId,
            userId: {
                not: userId
            }
        }
    });
}

export async function doesUserOnChatExist(userId: number, chatId: number): Promise<boolean> {
    return await prisma.usersOnChats.findUnique({
        select: {
            userId: true
        },
        where: {
            chatId_userId: {
                chatId: chatId,
                userId: userId
            }
        }
    }) != null;
}

export async function updateUserOnChatPermissionLevel(userId: number, chatId: number, permissionLevel: PermissionLevel): Promise<UsersOnChats | undefined> {
    try {
        const userOnChat = await prisma.usersOnChats.update({
            data: {
                permissionLevel: permissionLevel
            },
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });
        notifyAllUsersOnChat(chatId, 'chat-user-permission-level', {
            chatId: chatId,
            userId: userId,
            permissionLevel: permissionLevel
        });
        return userOnChat;
    } catch(_: any) {
        return undefined;
    }
}

export async function deleteUserOnChat(userId: number, chatId: number): Promise<UsersOnChats | undefined> {
    try {
        const userOnChat = await prisma.usersOnChats.delete({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });
        notifyAllUsersOnChat(chatId, 'chat-user-leave', {
            chatId: chatId,
            userId: userId
        });
        return userOnChat;
    } catch(_: any) {
        return undefined;
    }
}

export async function findUserOnChats(userId: number): Promise<UsersOnChats[]> {
    return prisma.usersOnChats.findMany({
        where: {
            userId: userId
        }
    });
}

export async function findUserOnChatPermissionLevel(userId: number, chatId: number): Promise<PermissionLevel> {
    const partialUserOnChat = await prisma.usersOnChats.findUnique({
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
        throw new NotFound();
    return partialUserOnChat.permissionLevel;
}
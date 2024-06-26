import { PermissionLevel, UsersOnChats } from "@prisma/client";
import { notifyAllUsersOnChat, notifyMainUser } from "../socket";
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
    try {
        const permissionLevel = await findUserOnChatPermissionLevel(userId, chatId);
        return permissionLevel == PermissionLevel.ADMINISTRATOR;
    } catch(e: any) {
        return false;
    }
}

export async function isUserOnChatNotViewer(userId: number, chatId: number): Promise<boolean> {
    try {
        const permissionLevel = await findUserOnChatPermissionLevel(userId, chatId);
        return permissionLevel != PermissionLevel.VIEWER;
    } catch(e: any) {
        return false;
    }
}

export async function isUserOnChatAdministratorOrModerator(userId: number, chatId: number): Promise<boolean> {
    try {
        const permissionLevel = await findUserOnChatPermissionLevel(userId, chatId);
        return permissionLevel == PermissionLevel.ADMINISTRATOR || permissionLevel == PermissionLevel.MODERATOR;
    } catch(e: any) {
        return false;
    }
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
        const data = {
            chatId: chatId,
            userId: userId
        };
        notifyAllUsersOnChat(chatId, 'chat-user-leave', data);
        notifyMainUser(userId, 'chat-user-leave', data);
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

export async function findUserOnChatLastReadMessageId(userId: number, chatId: number): Promise<number> {
    const partialUserOnChat = await prisma.usersOnChats.findUnique({
        select: {
            lastReadMessageId: true
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
    return partialUserOnChat.lastReadMessageId ?? 0;
}

export async function updateUserOnChatLastReadMessageId(userId: number, chatId: number, lastReadMessageId: number): Promise<UsersOnChats> {
    try {
        const userOnChat = await prisma.usersOnChats.update({
            data: {
                lastReadMessageId: lastReadMessageId
            },
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: userId
                }
            }
        });
        notifyMainUser(userId, 'chat-mark-as-read', { chatId: chatId, lastReadMessageId: lastReadMessageId });
        return userOnChat;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}
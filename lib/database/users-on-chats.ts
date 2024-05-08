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
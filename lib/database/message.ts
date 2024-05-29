import { Message } from "@prisma/client";
import { notifyAllUsersOnChat } from "../socket";
import { InternalServerError, NotFound, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function createMessage(messageText: string, userId: number, chatId: number): Promise<Message> {
    try {
        const message = await prisma.message.create({
            data: {
                message: Buffer.from(messageText),
                userId: userId,
                chatId: chatId
            }
        });
        notifyAllUsersOnChat(chatId, 'chat-message-send', {
            id: message.id,
            chatId: chatId,
            userId: userId,
            message: messageText,
            createdAt: message.createdAt
        });
        return message;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function findLastMessageId(chatId: number): Promise<number> {
    const lastMessage = await prisma.message.findFirst({
        select: {
            id: true
        },
        where: {
            chatId: chatId
        },
        orderBy: [
            {
                id: 'desc'
            }
        ]
    });
    if(lastMessage == null)
        throw new InternalServerError();
    return lastMessage.id;
}

export async function findLast16Messages(chatId: number, beforeMessageId: number | undefined): Promise<Message[]> {
    return prisma.message.findMany({
        where: {
            chatId: chatId,
            id: beforeMessageId != undefined ? {
                lt: beforeMessageId
            } : undefined
        },
        take: -16
    });
}

export async function findMessageChatIdUserIdAndDeletedAt(id: number): Promise<{ chatId: number; userId: number; deletedAt: Date | null; }> {
    const partialMessage = await prisma.message.findUnique({
        select: {
            chatId: true,
            userId: true,
            deletedAt: true
        },
        where: {
            id: id
        }
    });
    if(partialMessage == null)
        throw new NotFound();
    return partialMessage;
}

export async function updateMessage(id: number, messageText: string): Promise<Message> {
    try {
        const message = await prisma.message.update({
            data: {
                message: Buffer.from(messageText),
                editedAt: new Date()
            },
            where: {
                id: id
            }
        });
        notifyAllUsersOnChat(message.chatId, 'chat-message-edit', {
            id: message.id,
            chatId: message.chatId,
            message: messageText,
            editedAt: message.editedAt
        });
        return message;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}

export async function deleteMessage(id: number, messageText: string): Promise<Message> {
    try {
        const message = await prisma.message.update({
            data: {
                message: Buffer.from(messageText),
                deletedAt: new Date()
            },
            where: {
                id: id
            }
        });
        notifyAllUsersOnChat(message.chatId, 'chat-message-delete', {
            id: message.id,
            chatId: message.chatId,
            message: messageText,
            deletedAt: message.deletedAt
        });
        return message;
    } catch(e: any) {
        throw new UnprocessableContent();
    }
}
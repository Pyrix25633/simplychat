import { Message } from "@prisma/client";
import { InternalServerError, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";
import { notifyAllUsersOnChat } from "../socket";

export async function createMessage(messageText: string, userId: number, chatId: number): Promise<Message> {
    try {
        const message = await prisma.message.create({
            data: {
                message: Buffer.from(messageText),
                userId: userId,
                chatId: chatId
            }
        });
        notifyAllUsersOnChat(chatId, 'message-new', {
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
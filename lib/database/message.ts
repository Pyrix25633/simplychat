import { Message } from "@prisma/client";
import { InternalServerError, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";

export async function createMessage(message: string, userId: number, chatId: number): Promise<Message> {
    try {
        return await prisma.message.create({
            data: {
                message: Buffer.from(message),
                userId: userId,
                chatId: chatId
            }
        });
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
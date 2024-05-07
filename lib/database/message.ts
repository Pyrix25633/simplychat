import { Message } from "@prisma/client";
import { UnprocessableContent } from "../web/response";
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
import { Chat } from "@prisma/client";
import { NotFound, UnprocessableContent } from "../web/response";
import { prisma } from "./prisma";
import { generateChatLogo, generateChatToken } from "../random";

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
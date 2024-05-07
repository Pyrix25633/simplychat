import { Chat } from "@prisma/client";
import { UnprocessableContent } from "../web/response";
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
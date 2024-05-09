import { Request, Response } from "express";
import { Forbidden, Ok, handleException } from "../web/response";
import { validateToken } from "./auth";
import { getInt, getNonEmptyString, getObject } from "../validation/type-validation";
import { getDescription, getName, getToken } from "../validation/semantic-validation";
import { createChat, findChat } from "../database/chat";
import { prisma, simplychat } from "../database/prisma";
import { countUsersOnChat, createUserOnChat } from "../database/users-on-chats";
import { PermissionLevel } from "@prisma/client";
import { createMessage } from "../database/message";

export async function postChat(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const body = getObject(req.body);
        const name = getName(body.name);
        const description = getDescription(body.description);
        await prisma.$transaction(async (): Promise<void> => {
            const chat = await createChat(name, description);
            await createUserOnChat(partialUser.id, chat.id, PermissionLevel.ADMINISTRATOR);
            await createMessage('@' + partialUser.id + ' created this Chat!', (await simplychat).id, chat.id);
            new Ok({ id: chat.id }).send(res);
        });
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChatJoin(req: Request, res: Response): Promise<void> {
    try {
        await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const token = getToken(req.query.token);
        const chat = await findChat(chatId);
        if(token != chat.token || (chat.tokenExpiration != null && chat.tokenExpiration < new Date()))
            throw new Forbidden();
        new Ok({
            name: chat.name,
            description: chat.description,
            logo: chat.logo.toString(),
            users: await countUsersOnChat(chat.id)
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
import { Request, Response } from "express";
import { Ok, handleException } from "../web/response";
import { validateToken } from "./auth";
import { getObject } from "../validation/type-validation";
import { getDescription, getName } from "../validation/semantic-validation";
import { createChat } from "../database/chat";
import { prisma } from "../database/prisma";
import { createUserOnChat } from "../database/users-on-chats";
import { PermissionLevel } from "@prisma/client";
import { createMessage } from "../database/message";

export async function postChats(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const body = getObject(req.body);
        const name = getName(body.name);
        const description = getDescription(body.description);
        await prisma.$transaction(async (): Promise<void> => {
            const chat = await createChat(name, description);
            await createUserOnChat(partialUser.id, chat.id, PermissionLevel.ADMINISTRATOR);
            await createMessage('@' + partialUser.id + ' created this Chat!', partialUser.id, chat.id);
            new Ok({ id: chat.id }).send(res);
        });
    } catch(e: any) {
        handleException(e, res);
    }
}
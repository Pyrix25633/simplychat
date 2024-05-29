import { PermissionLevel, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { createChat, doesChatExist, findChat, findChatInfo, updateChatLogo, updateChatSettings, updateChatToken } from "../database/chat";
import { createMessage, deleteMessage, findLast16Messages, findLastMessageId, findMessageChatIdUserIdAndDeletedAt, updateMessage } from "../database/message";
import { prisma, simplychat } from "../database/prisma";
import { countUsersOnChat, createUserOnChat, deleteUserOnChat, doesUserOnChatExist, findUserOnChats, findUsersOnChat, findUsersOnChatExcept, isUserOnChatAdministrator, isUserOnChatAdministratorOrModerator, isUserOnChatNotViewer, updateUserOnChatPermissionLevel } from "../database/users-on-chats";
import { generateChatToken } from "../random";
import { getBase64EncodedImage, getDescription, getMessage, getModifiedUsers, getName, getPermissionLevel, getRemovedUsers, getToken, getTokenExpiration } from "../validation/semantic-validation";
import { getInt, getObject, getOrUndefined } from "../validation/type-validation";
import { Created, Forbidden, NoContent, NotFound, Ok, handleException } from "../web/response";
import { validateToken } from "./auth";

export async function postChat(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const body = getObject(req.body);
        const name = getName(body.name);
        const description = getDescription(body.description);
        await prisma.$transaction(async (): Promise<void> => {
            try {
                const chat = await createChat(name, description);
                await createMessage('@' + partialUser.id + ' created this Chat!', (await simplychat).id, chat.id);
                await createUserOnChat(partialUser.id, chat.id, PermissionLevel.ADMINISTRATOR);
                new Created({ id: chat.id }).send(res);
            } catch(e: any) {
                throw e;
            }
        }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted });
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

export async function postChatJoin(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const body = getObject(req.body);
        const token = getToken(body.token);
        const chat = await findChat(chatId);
        if(token != chat.token || (chat.tokenExpiration != null && chat.tokenExpiration < new Date()))
            throw new Forbidden();
        await prisma.$transaction(async (): Promise<void> => {
            try {
                await createUserOnChat(partialUser.id, chat.id, chat.defaultPermissionLevel);
                await createMessage('Welcome @' + partialUser.id + '!', (await simplychat).id, chat.id);
            } catch(e: any) {
                throw e;
            }
        });
        new NoContent().send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChatSettings(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const chat = await findChat(chatId);
        if(!(await isUserOnChatAdministrator(partialUser.id, chat.id)))
            throw new Forbidden();
        new Ok({
            name: chat.name,
            description: chat.description,
            token: chat.token,
            tokenExpiration: chat.tokenExpiration,
            defaultPermissionLevel: chat.defaultPermissionLevel,
            logo: chat.logo.toString(),
            users: await findUsersOnChatExcept(chatId, partialUser.id)
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function patchChatSettings(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        if(!(await doesChatExist(chatId)))
            throw new NotFound();
        if(!(await isUserOnChatAdministrator(partialUser.id, chatId)))
            throw new Forbidden();
        const body = getObject(req.body);
        const name = getName(body.name);
        const description = getDescription(body.description);
        const tokenExpiration = getTokenExpiration(body.tokenExpiration);
        const defaultPermissionLevel = getPermissionLevel(body.defaultPermissionLevel);
        const logo = getOrUndefined(body.logo, getBase64EncodedImage);
        const modifiedUsers = getModifiedUsers(body.modifiedUsers);
        const removedUsers = getRemovedUsers(body.removedUsers);
        await prisma.$transaction(async (): Promise<void> => {
            try {
                await updateChatSettings(chatId, name, description, tokenExpiration, defaultPermissionLevel);
                if(logo != undefined)
                    await updateChatLogo(chatId, logo);
                for(const modifiedUser of modifiedUsers)
                    await updateUserOnChatPermissionLevel(modifiedUser.userId, chatId, modifiedUser.permissionLevel);
                for(const removedUser of removedUsers) {
                    await deleteUserOnChat(removedUser, chatId);
                    await createMessage('@' + partialUser.id + ' removed @' + removedUser + '.', (await simplychat).id, chatId);
                }
                new NoContent().send(res);
            } catch(e: any) {
                throw e;
            }
        });
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function postChatRegenerateToken(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const chat = await findChat(chatId);
        if(!(await isUserOnChatAdministrator(partialUser.id, chat.id)))
            throw new Forbidden();
        const token = generateChatToken(chat.name, chat.description);
        await updateChatToken(chat.id, token);
        new Ok({
            token: token
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChats(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const userOnChats = await findUserOnChats(partialUser.id);
        const chats: { id: number; permissionLevel: PermissionLevel; lastReadMessageId: number; lastMessageId: number; }[] = [];
        for(const userOnChat of userOnChats) {
            chats.push({
                id: userOnChat.chatId,
                permissionLevel: userOnChat.permissionLevel,
                lastReadMessageId: userOnChat.lastReadMessageId ?? 0,
                lastMessageId: await findLastMessageId(userOnChat.chatId)
            });
        }
        new Ok({ chats: chats }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChat(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const chatInfo = await findChatInfo(chatId);
        if(!(await doesUserOnChatExist(partialUser.id, chatId)))
            throw new Forbidden();
        return new Ok({
            name: chatInfo.name,
            description: chatInfo.description,
            logo: chatInfo.logo.toString()
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChatUsers(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        if(!(await doesChatExist(chatId)))
            throw new NotFound();
        if(!(await doesUserOnChatExist(partialUser.id, chatId)))
            throw new Forbidden();
        new Ok({ users: await findUsersOnChat(chatId) }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function postChatLeave(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        if(!(await doesChatExist(chatId)))
            throw new NotFound();
        if(!(await doesUserOnChatExist(partialUser.id, chatId)))
            throw new Forbidden();
        await prisma.$transaction(async (): Promise<void> => {
            try {
                await deleteUserOnChat(partialUser.id, chatId);
                await createMessage('@' + partialUser.id + ' left the Chat.', (await simplychat).id, chatId);
                new NoContent().send(res);
            } catch(e: any) {
                throw e;
            }
        });
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function getChatMessages(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const beforeMessageId = getOrUndefined(req.query.beforeMessageId, getInt);
        if(!(await doesChatExist(chatId)))
            throw new NotFound();
        if(!(await doesUserOnChatExist(partialUser.id, chatId)))
            throw new Forbidden();
        const messages = await findLast16Messages(chatId, beforeMessageId);
        const response: {
            id: number;
            createdAt: Date; 
            editedAt: Date | null;
            deletedAt: Date | null;
            message: string;
            userId: number;
        }[] = [];
        for(const message of messages) {
            response.push({
                id: message.id,
                createdAt: message.createdAt,
                editedAt: message.editedAt,
                deletedAt: message.deletedAt,
                message: message.message.toString(),
                userId: message.userId
            });
        }
        new Ok({
            messages: response
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function postChatMessage(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const body = getObject(req.body);
        const message = getMessage(body.message);
        if(!(await doesChatExist(chatId)))
            throw new NotFound();
        if(!(await isUserOnChatNotViewer(partialUser.id, chatId)))
            throw new Forbidden();
        new Created({
            id: (await createMessage(message, partialUser.id, chatId)).id
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function patchChatMessage(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const messageId = getInt(req.params.messageId);
        const body = getObject(req.body);
        const message = getMessage(body.message);
        const partialMessage = await findMessageChatIdUserIdAndDeletedAt(messageId);
        if(partialMessage.chatId != chatId)
            throw new NotFound();
        if(partialMessage.userId != partialUser.id || partialMessage.deletedAt != null)
            throw new Forbidden();
        await updateMessage(messageId, message);
        new NoContent().send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}

export async function deleteChatMessage(req: Request, res: Response): Promise<void> {
    try {
        const partialUser = await validateToken(req);
        const chatId = getInt(req.params.chatId);
        const messageId = getInt(req.params.messageId);
        const partialMessage = await findMessageChatIdUserIdAndDeletedAt(messageId);
        if(partialMessage.chatId != chatId)
            throw new NotFound();
        if(partialMessage.deletedAt != null)
            throw new Forbidden();
        if(partialMessage.userId != partialUser.id && !isUserOnChatAdministratorOrModerator(partialUser.id, chatId))
            throw new Forbidden();
        await deleteMessage(messageId, 'Message deleted by @' + partialUser.id + '.');
        new NoContent().send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
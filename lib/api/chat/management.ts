import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { addUserToChat, createChat, insertMessage, removeUserFromChat, selectChat } from "../../database";
import { createChatToken } from "../../hash";
import { generateRandomChatLogo } from "../../random-image";
import { CreateRequest, JoinChatRequest, LeaveChatRequest, isCreateRequestValid, isJoinChatRequestValid, isLeaveChatRequestValid } from "../../types/api/chat";
import { validateTokenAndProceed } from "../user/authentication";
import { settings } from '../../settings';
import { notifyAllUsersInChat, sockets } from '../../socket';
import { getTimestamp } from '../../timestamp';

export function create(req: Request, res: Response): void {
    const request: CreateRequest = req.body;
    if(!isCreateRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    for(let i = 0; i < request.name.length; i++) {
        const c = request.name.codePointAt(i);
        if(c == undefined || !((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
            res.status(400).send('Bad Request');
            return;
        }
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        createChat(user.id, request.name, request.description, createChatToken(request.name, user.id), (err: MysqlError | null, id: number | null): void => {
            if(err || id == null) {
                res.status(500).send('Internal Server Error');
                return;
            }
            generateRandomChatLogo(id);
            res.status(201).send('Created');
        });
    });
}

export function join(req: Request, res: Response): void {
    const request: JoinChatRequest = req.body;
    if(!isJoinChatRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        selectChat(request.chatId, (err: MysqlError | null, results?: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            if(results.length == 0) {
                res.status(404).send('Not Found');
                return;
            }
            const chat = results[0];
            const chatUser = JSON.parse(chat.users)[request.id];
            if(chatUser != undefined || (chat.token != request.chatToken || (chat.token_expiration != null && chat.token_expiration < getTimestamp()))) {
                res.status(403).send('Forbidden');
                return;
            }
            addUserToChat(request.chatId, request.id, (err: MysqlError | null, permissionLevel: number): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                insertMessage(request.chatId, 0, 'Welcome @' + request.id + '!', (err: MysqlError | null, id?: number): void => {
                    if(err) {
                        console.log(err);
                        return;
                    }
                    if(settings.dynamicUpdates['message-new'])
                        notifyAllUsersInChat(chat, 'message-new', {id: id});
                });
                if(settings.dynamicUpdates['user-join']) {
                    notifyAllUsersInChat(chat, 'user-join', {chatId: chat.id, id: request.id, permissionLevel: permissionLevel});
                    const userSockets = sockets.get(request.id);
                    if(userSockets == undefined) return;
                    for(const socket of userSockets)
                        socket.emit('user-join', {chatId: chat.id, id: request.id, permissionLevel: permissionLevel});
                }
                res.status(200).send('OK');
            });
        });
    });
}

export function leave(req: Request, res: Response): void {
    const request: LeaveChatRequest = req.body;
    if(!isLeaveChatRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 3, res, (user: any, chat: any): void => {
        removeUserFromChat(request.chatId, request.id);
            insertMessage(request.chatId, 0, '@' + request.id + ' left the chat', (err: MysqlError | null, id?: number): void => {
                if(err) {
                    console.log(err);
                    return;
                }
                if(settings.dynamicUpdates['message-new'])
                    notifyAllUsersInChat(chat, 'message-new', {id: id});
            });
            if(settings.dynamicUpdates['user-leave'])
                notifyAllUsersInChat(chat, 'user-leave', {chatId: chat.id, id: request.id});
            res.status(200).send('OK');
    });
}

export function validatePermissionLevelAndProceed(id: number, token: string, chatId: number, permissionLevel: number, res: Response, callback: (user: any, chat: any) => void) {
    validateTokenAndProceed(id, token, res, (user) => {
        selectChat(chatId, (err: MysqlError | null, results: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            if(results.length == 0) {
                res.status(404).send('Not Found');
                return;
            }
            const chat = results[0];
            const chatUser = JSON.parse(chat.users)[id.toString()];
            if(chatUser != undefined && chatUser.permissionLevel <= permissionLevel) {
                callback(user, chat);
                return;
            }
            res.status(403).send('Forbidden');
        });
    });
}
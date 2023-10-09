import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { insertMessage, selectLastMessages, selectMessage, updateDeleteMessage, updateEditMessage } from "../../database";
import { DeleteMessageRequest, EditMessageRequest, GetLastMessagesRequest, GetMessageRequest, SendMessageRequest, isDeleteMessageRequestValid, isEditMessageRequestValid, isGetLastMessagesRequestValid, isGetMessageRequestValid, isSendMessageRequestValid } from "../../types/api/chat";
import { validatePermissionLevelAndProceed } from './management';
import { notifyAllUsersInChat } from '../../socket';
import { settings } from '../../settings';


export function getMessage(req: Request, res: Response): void {
    const request: GetMessageRequest = req.body;
    if(!isGetMessageRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 4, res, (user: any): void => {
        selectMessage(request.chatId, request.messageId, (err: MysqlError | null, results?: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            if(results.length == 0) {
                res.status(404).send('Not Found');
                return;
            }
            const message = results[0];
            res.status(200).send({
                id: message.id,
                timestamp: message.timestamp,
                userId: message.user_id,
                message: new String(message.message),
                edited: message.edited,
                deleted: message.deleted
            });
        });
    });
}

export function getLastMessages(req: Request, res: Response): void {
    const request: GetLastMessagesRequest = req.body;
    if(!isGetLastMessagesRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 4, res, (user: any): void => {
        selectLastMessages(request.chatId, request.numberOfMessages, (err: MysqlError | null, results: any): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            const lastMessages: {lastMessages: any[]} = {lastMessages: []};
            for(let message of results) {
                lastMessages.lastMessages.push({
                    id: message.id,
                    timestamp: message.timestamp,
                    userId: message.user_id,
                    message: new String(message.message),
                    edited: message.edited,
                    deleted: message.deleted
                });
            }
            res.status(200).send(lastMessages);
        });
    });
}

export function sendMessage(req: Request, res: Response): void {
    const request: SendMessageRequest = req.body;
    if(!isSendMessageRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 2, res, (user, chat) => {
        const expr = /^\s*(.*\S)\s*$/gm;
        let message = '';
        for(let match = expr.exec(request.message); match != null; match = expr.exec(request.message))
            message += match[1] + '\n';
        message = message.replace('\n', '');
        insertMessage(request.chatId, request.id, message, (err: MysqlError | null, id?: number): void => {
            if(err) {
                console.log(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            res.status(201).send('Created');
            if(settings.dynamicUpdates['message-send'])
                notifyAllUsersInChat(chat, 'message-send', {id: id});
        });
    });
}

export function editMessage(req: Request, res: Response): void {
    const request: EditMessageRequest = req.body;
    if(!isEditMessageRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 2, res, (user, chat) => {
        const expr = /^\s*(.*\S)\s*$/gm;
        let message = '';
        for(let match = expr.exec(request.message); match != null; match = expr.exec(request.message))
            message += match[1] + '\n';
        message.replace('\n', '');
        selectMessage(request.chatId, request.messageId, (err: MysqlError | null, results?: any): void => {
            if(err || results.length == 0) {
                console.log(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            if(results[0].user_id != request.id || results[0].deleted) {
                res.status(403).send('Forbidden');
                return;
            }
            updateEditMessage(request.chatId, request.messageId, request.message, (err: MysqlError | null) => {
                if(err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                res.status(200).send('OK');
                if(settings.dynamicUpdates['message-edit'])
                    notifyAllUsersInChat(chat, 'message-edit', {id: request.messageId, message: request.message});
            });
        });
    });
}

export function deleteMessage(req: Request, res: Response): void {
    const request: DeleteMessageRequest = req.body;
    if(!isDeleteMessageRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 1, res, (user, chat) => {
        selectMessage(request.chatId, request.messageId, (err: MysqlError | null, results?: any): void => {
            if(err || results.length == 0) {
                console.log(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            callDeleteMessage(request, res, chat, results[0]);
        });
    }, (user, chat) => {
        selectMessage(request.chatId, request.messageId, (err: MysqlError | null, results?: any): void => {
            if(err || results.length == 0) {
                console.log(err);
                res.status(500).send('Internal Server Error');
                return;
            }
            if(results[0].user_id != request.id) {
                res.status(403).send('Forbidden');
                return;
            }
            callDeleteMessage(request, res, chat, results[0]);
        });
    });
}

function callDeleteMessage(request: DeleteMessageRequest, res: Response, chat: any, message: any) {
    updateDeleteMessage(request.chatId, request.messageId, request.id, (err: MysqlError | null): void => {
        if(err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        if(message.deleted) {
            res.status(403).send('Forbidden');
            return;
        }
        res.status(200).send('OK');
        if(settings.dynamicUpdates['message-delete'])
            notifyAllUsersInChat(chat, 'message-delete', {id: request.messageId, userId: request.id});
    });
}
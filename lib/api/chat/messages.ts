import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { insertMessage, selectLastMessages, selectMessage } from "../../database";
import { GetLastMessagesRequest, GetMessageRequest, SendMessageRequest, isGetLastMessagesRequestValid, isGetMessageRequestValid, isSendMessageRequestValid } from "../../types/api/chat";
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
                modified: message.modified
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
                    modified: message.modified
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
        const capture = /^\s*(.*\S)\s*$/.exec(request.message);
        const message = capture == null ? '' : capture[1];
        insertMessage(request.chatId, request.id, message, (err: MysqlError | null, id?: number): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            res.status(201).send('Created');
            if(settings.dynamicUpdates['message-new'])
                notifyAllUsersInChat(chat, 'message-new', {id: id});
        });
    });
}
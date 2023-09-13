import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { insertMessage, selectLastMessages } from "../../database";
import { GetLastMessagesRequest, SendMessageRequest, isGetLastMessagesRequestValid, isSendMessageRequestValid } from "../../types/api/chat";
import { validateTokenAndProceed } from "../user/authentication";
import { validatePermissionLevelAndProceed } from './management';

export function getLastMessages(req: Request, res: Response): void {
    const request: GetLastMessagesRequest = req.body;
    if(!isGetLastMessagesRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        const chats = JSON.parse(user.chats);
        if(chats[request.chatId] != undefined) {
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
        }
        else
            res.status(403).send('Forbidden');
    });
}

export function sendMessage(req: Request, res: Response): void {
    const request: SendMessageRequest = req.body;
    if(!isSendMessageRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 2, res, () => {
        insertMessage(request.chatId, request.id, request.message, (err: MysqlError | null): void => {
            if(err) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            res.status(201).send('Created');
        });
    });
}
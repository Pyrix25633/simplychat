import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { ChatInfoRequest, ListRequest, isChatInfoRequestValid, isListRequestValid } from '../../types/api/chat';
import { validateTokenAndProceed } from '../user/authentication';
import { selectChat } from '../../database';

export function list(req: Request, res: Response): void {
    const request: ListRequest = req.body;
    if(!isListRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        res.status(200).send({chats: JSON.parse(user.chats)});
    });
}

export function chatInfo(req: Request, res: Response): void {
    const request: ChatInfoRequest = req.body;
    if(!isChatInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
        const chats = JSON.parse(user.chats);
        if(user.chats[request.chatId] != undefined) {
            selectChat(request.chatId, (err: MysqlError | null, results: any): void => {
                if(err) {
                    res.status(500).send('Internal Server Error');
                    console.log(err);
                    return;
                }
                if(results.length == 0) {
                    res.status(404).send('Not Found');
                    return;
                }
                const selected = results[0];
                res.status(200).send({
                    name: selected.name,
                    description: selected.description,
                    chatLogoType: selected.chat_logo_type,
                    users: JSON.parse(selected.users)
                });
            });
        }
        else
            res.status(403).send('Forbidden');
    });
}
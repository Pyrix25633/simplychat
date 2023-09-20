import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { ChatInfoRequest, ChatJoinInfoRequest, ListRequest, isChatInfoRequestValid, isChatJoinInfoRequestValid, isListRequestValid } from '../../types/api/chat';
import { validateTokenAndProceed } from '../user/authentication';
import { selectChat } from '../../database';
import { getTimestamp } from '../../timestamp';

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

export function chatJoinInfo(req: Request, res: Response): void {
    const request: ChatJoinInfoRequest = req.body;
    if(!isChatJoinInfoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validateTokenAndProceed(request.id, request.token, res, (user: any): void => {
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
            if(selected.token != request.chatToken || (selected.token_expiration != null && selected.token_expiration < getTimestamp())) {
                res.status(403).send('Forbidden');
                return;
            }
            res.status(200).send({
                name: selected.name,
                description: selected.description,
                chatLogoType: selected.chat_logo_type,
                users: Object.keys(JSON.parse(selected.users)).length
            });
        });
    });
}
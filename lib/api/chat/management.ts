import { Request, Response } from 'express';
import { MysqlError } from 'mysql';
import { createChat, selectChat } from "../../database";
import { createChatToken } from "../../hash";
import { generateRandomChatLogo } from "../../random-image";
import { CreateRequest, isCreateRequestValid } from "../../types/api/chat";
import { validateTokenAndProceed } from "../user/authentication";

export function create(req: Request, res: Response): void {
    const request: CreateRequest = req.body;
    if(!isCreateRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
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

export function validatePermissionLevelAndProceed(id: number, token: string, chatId: number, permissionLevel: number, res: Response, callback: (user: any, chat: any) => void) {
    validateTokenAndProceed(id, token, res, (user) => {
        selectChat(chatId, (err: MysqlError | null, results: any): void => {
            if(err || results.length == 0) {
                res.status(500).send('Internal Server Error');
                console.log(err);
                return;
            }
            const chat = results[0];
            const users = JSON.parse(chat.users);
            if(users[id.toString()].permissionLevel <= permissionLevel) {
                callback(user, chat);
                return;
            }
            res.status(403).send('Forbidden');
        });
    });
}
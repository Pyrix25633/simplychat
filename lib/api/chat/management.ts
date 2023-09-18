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

export function validatePermissionLevelAndProceed(id: number, token: string, chatId: number, permissionLevel: number, res: Response, callback: (user: any, chat: any) => void) {
    validateTokenAndProceed(id, token, res, (user) => {
        selectChat(chatId, (err: MysqlError | null, results: any): void => {
            if(err || results.length == 0) {
                res.status(500).send('Internal Server Error');
                console.log(err);
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
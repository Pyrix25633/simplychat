import { Request, Response } from 'express';
import imageSize from 'image-size';
import * as fs from 'fs';
import { insertMessage, removeUserFromChat, updateChatLogoType, updateChatSettings, updateChatUser } from '../../database';
import { createChatToken } from '../../hash';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';
import { GenerateTokenRequest, GetChatSettingsRequest, SetChatLogoRequest, SetChatSettingsRequest, isGenerateTokenRequestValid, isGetChatSettingsRequestValid, isSetChatLogoRequestValid, isSetChatSettingsRequestValid } from '../../types/api/chat';
import { validatePermissionLevelAndProceed } from './management';
import { settings } from '../../settings';
import { notifyAllUsersInChat } from '../../socket';
import { MysqlError } from 'mysql';

export function getChatSettings(req: Request, res: Response): void {
    const request: GetChatSettingsRequest = req.body;
    if(!isGetChatSettingsRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 0, res, (user: any, chat: any): void => {
        res.status(200).send({
            id: chat.id,
            name: chat.name,
            users: JSON.parse(chat.users),
            description: chat.description,
            token: chat.token,
            tokenExpiration: chat.token_expiration,
            defaultPermissionLevel: chat.default_permission_level,
            chatLogoType: chat.chat_logo_type
        });
    });
}

export function generateChatToken(req: Request, res: Response): void {
    const request: GenerateTokenRequest = req.body;
    if(!isGenerateTokenRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 0, res, (user: any, chat: any): void => {
        res.status(200).send({token: createChatToken(chat.name, user.id)});
    });
}

export function setChatSettings(req: Request, res: Response): void {
    const request: SetChatSettingsRequest = req.body;
    if(!isSetChatSettingsRequestValid(request)) {
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
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 0, res, (user: any, chat: any): void => {
        updateChatSettings(request.chatId, request.name, request.description,
            request.chatToken, request.tokenExpiration, request.defaultPermissionLevel);
        for(const userId of request.removedUsers) {
            if(typeof userId != 'number') continue;
            removeUserFromChat(request.chatId, userId);
            insertMessage(request.chatId, 0, '@' + userId + ' was removed by @' + request.id, (err: MysqlError | null, id?: number): void => {
                if(err) {
                    console.log(err);
                    return;
                }
                if(settings.dynamicUpdates['message-new'])
                    notifyAllUsersInChat(chat, 'message-new', {id: id});
            });
        }
        for(const userId of Object.keys(JSON.parse(chat.users))) {
            const user = request.modifiedUsers[userId];
            if(user == undefined || typeof user.permissionLevel != 'number' ||
                user.permissionLevel < 0 || user.permissionLevel > 3) continue;
            updateChatUser(request.chatId, parseInt(userId), user.permissionLevel);
        }
        res.status(200).send('OK');
        if(settings.dynamicUpdates['chat-settings'])
            notifyAllUsersInChat(chat, 'chat-settings', {
                chatId: chat.id,
                modifiedUsers: request.modifiedUsers,
                removedUsers: request.removedUsers
            });
    });
}

export function setChatLogo(req: Request, res: Response): void {
    const request: SetChatLogoRequest = req.body;
    if(!isSetChatLogoRequestValid(request)) {
        res.status(400).send('Bad Request');
        return;
    }
    validatePermissionLevelAndProceed(request.id, request.token, request.chatId, 0, res, (user: any, chat: any): void => {
        const match = /^data:image\/(?:(?:(\S+)\+\S+)|(\S+));base64,(\S*)$/.exec(request.chatLogo);
        if(match == null || !(match[1] == 'svg' || match[2] == 'png' || match[2] == 'jpeg' || match[2] == 'gif')) {
            res.status(400).send('Bad Request');
            return;
        }
        const dimensions: ISizeCalculationResult = imageSize(Buffer.from(match[3], 'base64'));
        const chatLogoType = match[1] == undefined ? match[2] : match[1];
        if(dimensions.width != dimensions.height || dimensions.width == undefined || dimensions.width > 2048 ||
            (chatLogoType == 'svg' && dimensions.width < 8) || (chatLogoType != 'svg' && dimensions.width < 64)) {
            res.status(400).send('Bad Request');
            return;
        }
        fs.writeFile('./chatLogos/' + chat.id + '.' + chatLogoType, match[3], {encoding: 'base64'}, function(err) {
            if(err) {
                console.log('Internal Server Error')
                res.status(500).send('Internal Server Error');
                return;
            }
            updateChatLogoType(chat.id, chatLogoType);
            if(chat.chatl_logo_type != chatLogoType) {
                fs.unlink('./chatLogos/' + chat.id + '.' + chat.chat_logo_type, (err) => {
                    if(err) res.status(500).send('Internal Server Error');
                    else res.status(200).send('OK');
                });
            }
            else
                res.status(200).send('OK');
        });
    });
}
import { TokenIdObject } from "./global";

// create

export type CreateRequest = {
    token: string,
    id: number,
    name: string,
    description: string
};

export function isCreateRequestValid(req: CreateRequest) {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.name != undefined && typeof req.name == 'string'
        && req.name.length > 2 && req.name.length <= 64
        && req.description != undefined && typeof req.description == 'string'
        && req.description.length > 2 && req.description.length <= 128;
}

// list

export type ListRequest = TokenIdObject;

export function isListRequestValid(req: ListRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

// info

export type ChatInfoRequest = {
    token: string,
    id: number,
    chatId: number
};

export function isChatInfoRequestValid(req: ChatInfoRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number';
}

// get-message

export type GetMessageRequest = {
    token: string,
    id: number,
    chatId: number,
    messageId: number
};

export function isGetMessageRequestValid(req: GetMessageRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.messageId != undefined && typeof req.messageId == 'number';
}

// get-last-messages

export type GetLastMessagesRequest = {
    token: string,
    id: number,
    chatId: number,
    numberOfMessages: number
};

export function isGetLastMessagesRequestValid(req: GetLastMessagesRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.numberOfMessages != undefined && typeof req.numberOfMessages == 'number'
        && req.numberOfMessages > 0 && req.numberOfMessages < 25;
}

//send-message

export type SendMessageRequest = {
    token: string,
    id: number,
    chatId: number,
    message: string
};

export function isSendMessageRequestValid(req: SendMessageRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.message != undefined && typeof req.message == 'string'
        && req.message.length <= 2048;
}
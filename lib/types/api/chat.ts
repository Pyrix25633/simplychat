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

// join

export type JoinRequest = {
    token: string,
    id: number,
    chatId: number,
    chatToken: string
};

export function isJoinRequestValid(req: JoinRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.chatToken != undefined && typeof req.chatToken == 'string'
        && req.chatToken.length == 128;
}

// leave

export type LeaveRequest = {
    token: string,
    id: number,
    chatId: number
};

export function isLeaveRequestValid(req: LeaveRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number';
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

// join-info

export type ChatJoinInfoRequest = {
    token: string,
    id: number,
    chatId: number,
    chatToken: string
};

export function isChatJoinInfoRequestValid(req: ChatJoinInfoRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.chatToken != undefined && typeof req.chatToken == 'string'
        && req.chatToken.length == 128;
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

//edit-message

export type EditMessageRequest = {
    token: string,
    id: number,
    chatId: number,
    messageId: number,
    message: string
};

export function isEditMessageRequestValid(req: EditMessageRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.messageId != undefined && typeof req.messageId == 'number'
        && req.message != undefined && typeof req.message == 'string'
        && req.message.length <= 2048;
}

//delete-message

export type DeleteMessageRequest = {
    token: string,
    id: number,
    chatId: number,
    messageId: number
};

export function isDeleteMessageRequestValid(req: DeleteMessageRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.messageId != undefined && typeof req.messageId == 'number';
}

// get-settings

export type GetChatSettingsRequest = {
    token: string,
    id: number,
    chatId: number
};

export function isGetChatSettingsRequestValid(req: GetChatSettingsRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number';
}

// generate-token

export type GenerateTokenRequest = {
    token: string,
    id: number,
    chatId: number
};

export function isGenerateTokenRequestValid(req: GenerateTokenRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number';
}

// set-settings

export type SetChatSettingsRequest = {
    token: string,
    id: number,
    chatId: number,
    name: string,
    description: string,
    chatToken: string,
    tokenExpiration: number,
    defaultPermissionLevel: number,
    removedUsers: number[],
    modifiedUsers: any
};

export function isSetChatSettingsRequestValid(req: SetChatSettingsRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.name != undefined && typeof req.name == 'string'
        && req.name.length > 2 && req.name.length <= 64
        && req.description != undefined && typeof req.description == 'string'
        && req.description.length > 2 && req.description.length <= 128
        && req.chatToken != undefined && typeof req.chatToken == 'string'
        && req.chatToken.length == 128
        && (req.tokenExpiration == undefined || typeof req.tokenExpiration == 'number')
        && req.defaultPermissionLevel != undefined && typeof req.defaultPermissionLevel == 'number'
        && req.defaultPermissionLevel >= 0 && req.defaultPermissionLevel <= 3
        && req.removedUsers != undefined && typeof req.removedUsers.length != undefined
        && typeof req.removedUsers.length == 'number'
        && req.modifiedUsers != undefined;
}

// set-chat-logo

export type SetChatLogoRequest = {
    token: string,
    id: number,
    chatId: number,
    chatLogo: string
};

export function isSetChatLogoRequestValid(req: SetChatLogoRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.chatId != undefined && typeof req.chatId == 'number'
        && req.chatLogo != undefined && typeof req.chatLogo == 'string';
}
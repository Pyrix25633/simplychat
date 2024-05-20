import { Socket } from "socket.io";
import { validateJsonWebToken } from "./auth";
import { getNonEmptyString, getObject } from "./validation/type-validation";
import { findUserToken } from "./database/user";
import { settings } from "./settings";
import { databaseStatuses, resourcesStatuses } from "./status";
import { findUsersOnChat } from "./database/users-on-chats";

type Data = { [index: string]: any; };
type Event = 'user-online' | 'user-settings' | 'chat-user-join' | 'chat-user-leave' |
    'chat-name-description' | 'chat-logo' | 'chat-user-permission-level' |
    'message-new' | 'message-edit' | 'message-delete' | 'mark-as-read' |
    'status-resources' | 'status-database';

const mainSockets: Map<number, Socket[]> = new Map();
const statusSockets: Socket[] = [];

export function onConnect(socket: Socket): void {
    const timeout = setTimeout((): void => {
        socket.disconnect();
    }, 2000);
    socket.once('connect-main', async (data: any): Promise<void> => {
        clearTimeout(timeout);
        try {
            data = getObject(data);
            const userId = await validateToken(data);
            let userSockets = mainSockets.get(userId);
            if(userSockets == undefined) {
                userSockets = [];
                mainSockets.set(userId, userSockets);
            }
            if(userSockets.length == 0)
                notifyUserOnline(userId, true);
            userSockets.push(socket);
            socket.once('disconnect', (): void => {
                const userSockets = mainSockets.get(userId);
                if(userSockets != undefined) {
                    userSockets.splice(userSockets.indexOf(socket), 1);
                    notifyUserOnline(userId, false);
                }
            });
        } catch(e: any) {
            socket.disconnect();
        }
    });
    socket.once('connect-status', async (data: any): Promise<void> => {
        clearTimeout(timeout);
        try {
            data = getObject(data);
            await validateToken(data);
            statusSockets.push(socket);
            socket.once('disconnect', (): void => {
                statusSockets.splice(statusSockets.indexOf(socket), 1);
            });
            socket.emit('status-resources-old', { resources: resourcesStatuses });
            socket.emit('status-database-old', { database: databaseStatuses });
        } catch(e: any) {
            socket.disconnect();
        }
    });
}

async function validateToken(data: Data): Promise<number> {
    return (await validateJsonWebToken(getNonEmptyString(data.auth), findUserToken)).id;
}

function notifyUserOnline(id: number, online: boolean): void {
    //TODO
}

export function notifyAllStatusUsers(event: Event, data: Data): void {
    if(!settings.dynamicUpdates[event])
        return;
    for(const statusSocket of statusSockets)
        statusSocket.emit(event, data);
}

export async function notifyAllUsersOnChat(chatId: number, event: Event, data: Data): Promise<void> {
    if(!settings.dynamicUpdates[event])
        return;
    const usersOnChat = await findUsersOnChat(chatId);
    for(const userOnChat of usersOnChat) {
        const userSockets = mainSockets.get(userOnChat.userId);
        if(userSockets == undefined)
            continue;
        for(const userSocket of userSockets)
            userSocket.emit(event, data);
    }
}
import { MysqlError } from "mysql";
import { selectChat, selectUser, selectUserToken, updateUserOnline } from "./database";
import { Socket } from "socket.io";
import { getTimestamp } from "./timestamp";
import { settings } from "./settings";
import { cachedStatusLongArray, cachedStatusShortArray } from "./status";

export const sockets: Map<number, Socket[]> = new Map<number, Socket[]>();
export const statusSockets: Socket[] = [];

export function onConnect(socket: Socket): void {
    socket.once('connect-user', (user: {id: number, token: string}): void => {
        selectUserToken(user.id, (err : MysqlError | null, results: any) => {
            if(err || results.length == 0 || results[0].token != user.token || results[0].token_expiration < getTimestamp()) {
                socket.disconnect(true);
                return;
            }
            let userSockets = sockets.get(user.id);
            if(userSockets == undefined || userSockets.length == 0) {
                userSockets = [];
                notifyUserOnline(user.id, true);
            }
            userSockets.push(socket);
            sockets.set(user.id, userSockets);
            socket.on('disconnect', () => {
                let userSockets1 = sockets.get(user.id);
                if(userSockets1 == undefined) return;
                userSockets1.splice(userSockets1.indexOf(socket), 1);
                sockets.set(user.id, userSockets1);
                if(userSockets1.length == 0) {
                    notifyUserOnline(user.id, false);
                }
            });
        });
    });
    socket.once('connect-status', (user: {id: number, token: string}): void => {
        selectUserToken(user.id, (err : MysqlError | null, results: any) => {
            if(err || results.length == 0 || results[0].token != user.token || results[0].token_expiration < getTimestamp()) {
                socket.disconnect(true);
                return;
            }
            socket.emit('status-short-old', {short: cachedStatusShortArray});
            socket.emit('status-long-old', {long: cachedStatusLongArray});
            statusSockets.push(socket);
            socket.on('disconnect', () => {
                statusSockets.splice(statusSockets.indexOf(socket), 1);
            });
        });
    });
}

function notifyUserOnline(id: number, online: boolean): void {
    const data: {id: number, online: boolean, lastOnline?: number} = {id: id, online: online};
    let lastOnline = 0;
    if(!online) {
        lastOnline = getTimestamp();
        data.lastOnline = lastOnline;
    }
    updateUserOnline(id, online, lastOnline);
    if(settings.dynamicUpdates['user-online'])
        notifyAllRelatedUsers(id, 'user-online', data, false);
}

export function notifyAllRelatedUsers(id: number, event: string, data: any, updateSelf: boolean): void {
    const notifiedUsers: Map<number, boolean> = new Map<number, boolean>();
    selectUser(id, (err: MysqlError | null, results?: any): void => {
        if(err || results[0] == undefined) return;
        for(const chatId of Object.keys(JSON.parse(results[0].chats))) {
            selectChat(parseInt(chatId), (err: MysqlError | null, results?: any): void => {
                if(err || results[0] == undefined) return;
                for(const userIdString of Object.keys(JSON.parse(results[0].users))) {
                    const userId = parseInt(userIdString);
                    if(!updateSelf && id == userId) continue;
                    if(notifiedUsers.get(userId) != true) {
                        const userSockets: Socket[] | undefined = sockets.get(userId);
                        if(userSockets == undefined) continue;
                        for(const userSocket of userSockets) {
                            data.id = id;
                            userSocket.emit(event, data);
                        }
                        notifiedUsers.set(userId, true);
                    }
                }
            });
        }
    });
}

export function notifyAllUsersInChat(chat: {id: number, users: string}, event: string, data: any): void {
    const users: string[] = Object.keys(JSON.parse(chat.users));
    for(const user of users) {
        const usersockets: Socket[] | undefined = sockets.get(parseInt(user));
        if(usersockets == undefined) continue;
        for(const usersocket of usersockets) {
            data.chatId = chat.id;
            usersocket.emit(event, data);
        }
    }
}
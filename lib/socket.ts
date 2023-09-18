import { MysqlError } from "mysql";
import { selectChat, selectUser, selectUserToken, updateUserOnline } from "./database";
import { Socket } from "socket.io";
import { getTimestamp } from "./timestamp";
import { settings } from "./settings";

export const sockets: Map<string, Socket[]> = new Map<string, Socket[]>();

export function onConnect(socket: Socket): void {
    socket.once('connect-user', (user: {id: number, token: string}): void => {
        selectUserToken(user.id, (err : MysqlError | null, results: any) => {
            if(err || results[0].token != user.token || results[0].token_expiration < getTimestamp()) {
                socket.disconnect(true);
                return;
            }
            let userSockets = sockets.get(user.id.toString());
            if(userSockets == undefined || userSockets.length == 0) {
                userSockets = [];
                notifyUserOnline(user.id, true);
            }
            userSockets.push(socket);
            sockets.set(user.id.toString(), userSockets);
            socket.on('disconnect', () => {
                let usersockets = sockets.get(user.id.toString());
                if(usersockets == undefined) return;
                usersockets.splice(usersockets.indexOf(socket));
                sockets.set(user.id.toString(), usersockets);
                if(usersockets.length == 0) {
                    notifyUserOnline(user.id, false);
                }
            });
        })
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
    if(settings.dynamicUpdates["user-online"])
        notifyAllRelatedUsers(id, 'user-online', data, false);
}

export function notifyAllRelatedUsers(id: number, event: string, data: any, updateSelf: boolean): void {
    const notifiedUsers: Map<string, boolean> = new Map<string, boolean>();
    const stringId = id.toString();
    selectUser(id, (err: MysqlError | null, results?: any): void => {
        if(err || results[0] == undefined) return;
        for(const chatId of Object.keys(JSON.parse(results[0].chats))) {
            selectChat(parseInt(chatId), (err: MysqlError | null, results?: any): void => {
                if(err || results[0] == undefined) return;
                for(const userId of Object.keys(JSON.parse(results[0].users))) {
                    if(!updateSelf && stringId == userId) continue;
                    if(notifiedUsers.get(userId) != true) {
                        const userSockets: Socket[] | undefined = sockets.get(userId);
                        if(userSockets == undefined) return;
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
        const usersockets: Socket[] | undefined = sockets.get(user);
        if(usersockets == undefined) continue;
        for(const usersocket of usersockets) {
            data.chatId = chat.id;
            usersocket.emit(event, data);
        }
    }
}
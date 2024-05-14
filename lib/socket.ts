import { Socket } from "socket.io";
import { validateJsonWebToken } from "./auth";
import { getNonEmptyString, getObject } from "./validation/type-validation";
import { findUserToken } from "./database/user";

type Data = { [index: string]: any; };

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
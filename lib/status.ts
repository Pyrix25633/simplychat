import { ExecException, exec } from "child_process";
import { statusSockets } from "./socket";
import { query } from "./database";
import { MysqlError } from "mysql";

export let cachedStatusShort = {cpu: 0, ram: 0, swap: 0};
export let cachedStatusLong = {users: 0, online: 0, chats: 0};

export function initializeStatus(): void {
    sendStatusShort();
    sendStatusLong();
}

function sendStatusShort(): void {
    setTimeout(sendStatusShort, 6000);
    exec('top -b -n 2 |grep -e Cpu -e buff -e Swap |tail -n 3', (error: ExecException | null, stdout: string, stderr: string): void => {
        if(!error) {
            const expr = /(\d{1,4},\d) (?:id|total|used)/gm;
            const dataArray: number[] = [];
            for(let match = expr.exec(stdout); match != null; match = expr.exec(stdout))
                dataArray.push(parseFloat(match[0]));
            cachedStatusShort = {
                cpu: 100 - dataArray[0],
                ram: 100 * (dataArray[2] / dataArray[1]),
                swap: 100 * (dataArray[4] / dataArray[3])
            };
            for(const socket of statusSockets)
                socket.emit('status-short', cachedStatusShort);
        }
    });
}

function sendStatusLong(): void {
    setTimeout(sendStatusLong, 60000);
    query('SELECT COUNT(*) AS users FROM users;', [], (errU: MysqlError | null, users?: any) => {
        if(errU) {
            console.log(errU);
            return;
        }
        query('SELECT COUNT(*) AS online FROM users WHERE online=true;', [], (errO: MysqlError | null, online?: any) => {
            if(errO) {
                console.log(errO);
                return;
            }
            query('SELECT COUNT(*) AS chats FROM chats;', [], (errC: MysqlError | null, chats?: any) => {
                if(errC) {
                    console.log(errC);
                    return;
                }
                cachedStatusLong = {users: users[0].users, online: online[0].online, chats: chats[0].chats};
                for(const socket of statusSockets)
                    socket.emit('status-long', cachedStatusLong);
            });
        });
    });
}
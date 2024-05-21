import { ExecException, exec } from "child_process";
import { prisma } from "./database/prisma";
import { notifyAllStatusUsers } from "./socket";

type ResourcesStatus = {
    cpu: number;
    ram: number;
    swap: number;
};

type DatabaseStatus = {
    users: number;
    online: number;
    chats: number;
}

export const resourcesStatuses: ResourcesStatus[] = [];
export const databaseStatuses: DatabaseStatus[] = [];

for(let i = 0; i < 11; i++) {
    resourcesStatuses.push({
        cpu: 0,
        ram: 0,
        swap: 0
    });
    databaseStatuses.push({
        users: 0,
        online: 0,
        chats: 0
    });
}

function sendResourcesStatus(): void {
    exec('top -b -n 2 |grep -e Cpu -e buff -e Swap |tail -n 3', (error: ExecException | null, stdout: string, stderr: string): void => {
        if(!error) {
            const lines = stdout.split('\n');
            const cpuMatch = lines[0].match(/(\d+.\d) id/);
            const ramMatch = lines[1].match(/(\d+.\d) total.* (\d+.\d) used/);
            const swapMatch = lines[2].match(/(\d+.\d) total.* (\d+.\d) used/);
            if(cpuMatch == null || ramMatch == null || swapMatch == null)
                return;
            const resourcesStatus = {
                cpu: 100 - parseFloat(cpuMatch[1]),
                ram: 100 * parseFloat(ramMatch[2]) / parseFloat(ramMatch[1]),
                swap: 100 * parseFloat(swapMatch[2]) / parseFloat(swapMatch[1])
            };
            resourcesStatuses.push(resourcesStatus);
            resourcesStatuses.shift();
            notifyAllStatusUsers('status-resources', resourcesStatus);
        }
    });
}

async function sendDatabaseStatus(): Promise<void> {
    const databaseStatus = {
        users: await countUsers(),
        online: await countOnlineUsers(),
        chats: await countChats()
    };
    databaseStatuses.push(databaseStatus);
    databaseStatuses.shift();
    notifyAllStatusUsers('status-database', databaseStatus);
}

sendResourcesStatus();
sendDatabaseStatus();

setInterval(sendResourcesStatus, 6000);
setInterval(sendDatabaseStatus, 60000);

async function countUsers(): Promise<number> {
    return prisma.user.count();
}

async function countOnlineUsers(): Promise<number> {
    return prisma.user.count({
        where: {
            online: true
        }
    });
}

async function countChats(): Promise<number> {
    return prisma.chat.count();
}
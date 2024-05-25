import { Request, Response } from "express";
import { findUserInfo } from "../database/user";
import { getInt } from "../validation/type-validation";
import { Ok, handleException } from "../web/response";
import { validateToken } from "./auth";

export async function getUser(req: Request, res: Response): Promise<void> {
    try {
        await validateToken(req);
        const userId = getInt(req.params.userId);
        const userInfo = await findUserInfo(userId);
        new Ok({
            username: userInfo.username,
            status: userInfo.status,
            online: userInfo.online,
            lastOnline: userInfo.lastOnline,
            pfp: userInfo.pfp.toString()
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
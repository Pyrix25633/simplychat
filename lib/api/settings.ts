import { Request, Response } from "express";
import { Ok, handleException } from "../web/response";
import { validateToken } from "./auth";
import { findUser } from "../database/user";

export async function getSettings(req: Request, res: Response): Promise<void> {
    try {
        const user = await validateToken(req, findUser);
        new Ok({
            id: user.id,
            username: user.username,
            email: user.email,
            pfp: user.pfp,
            status: user.status,
            tokenDuration: user.tokenDuration,
            tfa: user.tfaKey != null,
            settings: user.settings,
        }).send(res);
    } catch(e: any) {
        handleException(e, res);
    }
}
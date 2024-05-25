import jwt from "jsonwebtoken";
import { settings } from "./settings";
import { Unauthorized } from "./web/response";

export type AuthTokenPayload = {
    userId: number;
    token: string;
};

export type FindFunction<R> = (id: number) => Promise<R>;

export async function validateJsonWebToken<T extends { token: string; }>(authToken: string, findFunction: FindFunction<T>): Promise<T & { id: number; sessionExpiration: Date; }> {
    const payload = jwt.verify(authToken, settings.jwt.password) as AuthTokenPayload & { exp: number; };
    const partialUser = await findFunction(payload.userId);
    if(payload.token != partialUser.token)
        throw new Unauthorized();
    return { id: payload.userId, sessionExpiration: new Date(payload.exp * 1000), ...partialUser };
}
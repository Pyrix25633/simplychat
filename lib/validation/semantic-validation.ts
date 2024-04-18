import { BadRequest } from "../web/response";
import { getNonEmptyString } from "./type-validation";

const usernameRegex = /^(?:\w|-| ){3,32}$/;
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function getUsername(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.match(usernameRegex))
        return parsed;
    throw new BadRequest();
}

export function getEmail(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.match(emailRegex))
        return parsed;
    throw new BadRequest();
}
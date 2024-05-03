import { Customization } from "../database/user";
import { BadRequest } from "../web/response";
import { getBoolean, getInt, getNonEmptyString } from "./type-validation";

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

export function getStatus(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.length < 3 || parsed.length > 64)
        throw new BadRequest();
    return parsed;
}

export function getSixDigitCode(raw: any): number {
    const parsed = getInt(raw);
    if(parsed >= 100000 && parsed <= 999999)
        return parsed;
    throw new BadRequest();
}

export function getTfaToken(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.length == 128)
        return parsed;
    throw new BadRequest();
}

export function getCustomization(raw: any): Customization {
    if(typeof raw != 'object')
        throw new BadRequest();
    return {
        compactMode: getBoolean(raw.compactMode),
        condensedFont: getBoolean(raw.condensedFont),
        aurebeshFont: getBoolean(raw.aurebeshFont),
        sharpMode: getBoolean(raw.sharpMode)
    };
}

export function getBase64EncodedImage(raw: any): Buffer {
    const parsed = getNonEmptyString(raw);
    if(!parsed.match(/^data:image\/(?:svg\+xml|png|jpeg|gif);base64,\w+$/))
        throw new BadRequest();
    return Buffer.from(parsed);
}

export function getTokenDuration(raw: any): number {
    const parsed = getInt(raw);
    if(parsed < 5 || parsed > 90)
        throw new BadRequest();
    return parsed;
}

export function getTfaKey(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(!parsed.match(/^\w{20}$/))
        throw new BadRequest();
    return parsed;
}
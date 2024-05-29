import { PermissionLevel } from "@prisma/client";
import imageSize from "image-size";
import { ISizeCalculationResult } from "image-size/dist/types/interface";
import { Customization } from "../database/user";
import { BadRequest } from "../web/response";
import { getArray, getBoolean, getInt, getNonEmptyString, getObject } from "./type-validation";

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
    if(parsed < 100000 || parsed > 999999)
        throw new BadRequest();
    return parsed;
}

export function getToken(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.length != 128)
        throw new BadRequest();
    return parsed;
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
    const match = parsed.match(/^data:image\/(?:svg\+xml|png|jpeg|gif);base64,(.+)$/);
    if(match == null)
        throw new BadRequest();
    const dimensions: ISizeCalculationResult = imageSize(Buffer.from(match[1], 'base64'));
    if(dimensions.width != dimensions.height || dimensions.width == undefined)
        throw new BadRequest();
    if(dimensions.width < 8 || dimensions.width > 512)
        throw new BadRequest();
    return Buffer.from(parsed, 'base64');
}

export function getSessionDuration(raw: any): number {
    const parsed = getInt(raw);
    if(parsed < 5 || parsed > 90)
        throw new BadRequest();
    return parsed;
}

export function getTfaKey(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(!parsed.match(/^\w{52}$/))
        throw new BadRequest();
    return parsed;
}

export function getName(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.length < 3 || parsed.length > 64)
        throw new BadRequest();
    return parsed;
}

export function getDescription(raw: any): string {
    const parsed = getNonEmptyString(raw);
    if(parsed.length < 3 || parsed.length > 128)
        throw new BadRequest();
    return parsed;
}

export function getTokenExpiration(raw: any): Date | null {
    if(raw === null)
        return null;
    const parsed = getNonEmptyString(raw);
    if(!parsed.match(/\d{4}\/\d{1,2}\/\d{1,2}/))
        throw new BadRequest();
    const tokenExpiration = new Date(parsed);
    if(tokenExpiration.toString() == 'Invalid Date' || isNaN(tokenExpiration.getTime()))
        throw new BadRequest();
    return tokenExpiration;
}

export function getPermissionLevel(raw: any): PermissionLevel {
    const parsed = getNonEmptyString(raw);
    for(const permissionLevel of Object.values(PermissionLevel)) {
        if(permissionLevel == parsed)
            return permissionLevel;
    }
    throw new BadRequest();
}

type ModifiedUser = {
    userId: number;
    permissionLevel: PermissionLevel;
};

export function getModifiedUser(raw: any): ModifiedUser {
    const parsed = getObject(raw);
    return {
        userId: getInt(parsed.userId),
        permissionLevel: getPermissionLevel(parsed.permissionLevel)
    };
}

export function getModifiedUsers(raw: any): ModifiedUser[] {
    const parsed = getArray(raw);
    const modifiedUsers: ModifiedUser[] = [];
    for(const item of parsed)
        modifiedUsers.push(getModifiedUser(item));
    return modifiedUsers;
}

export function getRemovedUsers(raw: any): number[] {
    const parsed = getArray(raw);
    const removedUsers: number[] = [];
    for(const item of parsed)
        removedUsers.push(getInt(item));
    return removedUsers;
}

export function getMessage(raw: any): string {
    const parsed = getNonEmptyString(raw);
    let message = '';
    for(const line of parsed.split('\n'))
        message += line.trim() + '\n';
    return message.trim();
}
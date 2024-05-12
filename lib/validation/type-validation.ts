import { BadRequest } from "../web/response";

export function getObject(raw: any): { [index: string]: any; } {
    if(raw == undefined || typeof raw != "object")
        throw new BadRequest();
    return raw;
}

export function getArray(raw: any): any[] {
    if(raw == undefined || !Array.isArray(raw))
        throw new BadRequest();
    return raw;
}

export function getBoolean(raw: any): boolean {
    if(raw == undefined || typeof raw != "boolean")
        throw new BadRequest();
    return raw;
}

function parseInt(raw: any): number {
    const parsed = Number.parseInt(getNonEmptyString(raw));
    if(!Number.isSafeInteger(parsed))
        throw new BadRequest();
    return parsed;
}

export function getInt(raw: any): number {
    if(typeof raw == "string")
        raw = parseInt(raw);
    if(raw == undefined || typeof raw != "number")
        throw new BadRequest();
    if(!Number.isSafeInteger(raw))
        throw new BadRequest();
    return raw;
}

export function getFloat(raw: any): number {
    if(raw == undefined || typeof raw != "number")
        throw new BadRequest();
    return raw;
}

export function getString(raw: any): string {
    if(raw == undefined || typeof raw != "string")
        throw new BadRequest();
    return raw;
}

export function getNonEmptyString(raw: any): string {
    if(raw == undefined || typeof raw != "string")
        throw new BadRequest();
    if(raw.length == 0)
        throw new BadRequest();
    return raw;
}

type ParseFunction<R> = (raw: any) => R;

export function getOrNull<T>(raw: any, parseFunction: ParseFunction<T>): T | null {
    if(raw === null)
        return null;
    return parseFunction(raw);
}

export function getOrUndefined<T>(raw: any, parseFunction: ParseFunction<T>): T | undefined {
    if(raw === undefined)
        return undefined;
    return parseFunction(raw);
}
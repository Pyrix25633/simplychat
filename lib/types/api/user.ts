import { Response } from 'express';
import { TokenIdObject } from './global';
import { oneDayTimestamp } from '../../timestamp';

export function exitIfDeletedUser(user: any, res: Response): boolean {
    if(user.email == null || user.password_hash == null || user.token == null
        || user.token_expiration == null || user.token_duration == null || user.settings == null) {
        res.status(403).send('Forbidden');
        return true;
    }
    return false;
}

type FeedbackObject = {
    feedback: string | null
};

// register

export type RegisterRequest = {
    username: string,
    email: string,
    passwordHash: string
};

export function isRegisterRequestValid(req: RegisterRequest): boolean {
    return req.username != undefined && typeof req.username == 'string'
        && req.username.length > 2 && req.username.length <= 32
        && req.email != undefined && typeof req.email == 'string'
        && req.passwordHash != undefined && typeof req.passwordHash == 'string'
        && req.passwordHash.length == 128;
}

// username-feedback

export function isUsernameFeedbackRequestValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

export type UsernameFeedbackResponse = FeedbackObject;

// email-feedback

export function isEmailFeedbackRequestValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

// confirm

export type ConfirmRequest = {
    username: string,
    verificationCode: number
};

export function isConfirmRequestValid(req: ConfirmRequest): boolean {
    return req.username != undefined && typeof req.username == 'string'
    && req.username.length > 3 && req.username.length <= 32
    && req.verificationCode != undefined && typeof req.verificationCode == 'number';
}

// username-confirm-feedback

export function isUsernameConfirmFeedbackRequestValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

export type UsernameConfirmFeedbackResponse = FeedbackObject;

// login

export type LoginRequest = {
    username: string,
    passwordHash: string
};

export function isLoginRequestValid(req: LoginRequest): boolean {
    return req.username != undefined && typeof req.username == 'string'
        && req.username.length > 3 && req.username.length <= 32
        && req.passwordHash != undefined && typeof req.passwordHash == 'string'
        && req.passwordHash.length == 128;
}

// username-login-feedback

export function isUsernameLoginFeedbackValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

// tfauthenticate

export type TfauthenticateRequest = {
    id: number,
    tfaToken: string,
    tfaCode: string
};

export function isTfautheticateRequestValid(req: TfauthenticateRequest): boolean {
    return req.id != undefined && typeof req.id == 'number'
        && req.tfaToken != undefined && typeof req.tfaToken == 'string'
        && req.tfaToken.length == 128
        && req.tfaCode != undefined && typeof req.tfaCode == 'string'
        && req.tfaCode.length == 6;
}

// validate-token

export type ValidateTokenRequest = TokenIdObject;

export function isValidateTokenRequestValid(req: ValidateTokenRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

// regenerate-token

export type RegenerateTokenRequest = TokenIdObject;

export function isRegenerateTokenRequestValid(req: RegenerateTokenRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

// verify-tfa-code

export type VerifyTfaCodeRequest = {
    tfaKey: string,
    tfaCode: string
};

export function isVerifyTfaCodeRequestValid(req: VerifyTfaCodeRequest): boolean {
    return req.tfaKey != undefined && typeof req.tfaKey == 'string'
        && req.tfaKey.length == 52
        && req.tfaCode != undefined && typeof req.tfaCode == 'string'
        && req.tfaCode.length == 6;
}

// info

export type UserInfoRequest = {
    token: string,
    id: number,
    userId: number
};

export function isUserInfoRequestValid(req: UserInfoRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.userId != undefined && typeof req.userId == 'number';
}

// get-settings

export type GetSettingsRequest = TokenIdObject;

export function isGetSettingsRequestValid(req: GetSettingsRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

// set-settigns

export type SetSettingsRequest = {
    id: number,
    token: string,
    username: string,
    email: string,
    passwordHash: string,
    oldPasswordHash: string,
    tokenDuration: number,
    tfaActive: boolean,
    tfaKey: string | null
    status: string,
    settings: {
        compactMode: boolean,
        condensedFont: boolean,
        aurebeshFont: boolean,
        sharpMode: boolean
    }
};

export function isSetSettingsRequestValid(req: SetSettingsRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.username != undefined && typeof req.username == 'string'
        && req.username.length > 2 && req.username.length <= 32
        && req.email != undefined && typeof req.email == 'string'
        && req.passwordHash != undefined && typeof req.passwordHash == 'string'
        && (req.passwordHash.length == 128 || req.passwordHash.length == 0)
        && req.oldPasswordHash != undefined && typeof req.oldPasswordHash == 'string'
        && req.oldPasswordHash.length == 128
        && req.tokenDuration != undefined && typeof req.tokenDuration == 'number'
        && req.tokenDuration >= oneDayTimestamp * 5 && req.tokenDuration <= oneDayTimestamp * 90
        && req.tfaActive != undefined && typeof req.tfaActive == 'boolean'
        && ((typeof req.tfaKey == 'string' && req.tfaKey.length == 52) || req.tfaKey == null)
        && req.status != undefined && typeof req.status == 'string'
        && req.status.length > 2 && req.status.length <= 64
        && req.settings.compactMode != undefined && typeof req.settings.compactMode == 'boolean'
        && req.settings.condensedFont != undefined && typeof req.settings.condensedFont == 'boolean'
        && req.settings.aurebeshFont != undefined && typeof req.settings.aurebeshFont == 'boolean'
        && req.settings.sharpMode != undefined && typeof req.settings.sharpMode == 'boolean';
}

// set-pfp

export type SetPfpRequest = {
    token: string,
    id: number,
    pfp: string,
    pfpType: string
};

export function isSetPfpRequestValid(req: SetPfpRequest): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.pfp != undefined && typeof req.pfp == 'string'
        && req.pfpType != undefined && typeof req.pfpType == 'string'
        && req.pfpType.length < 6;
}
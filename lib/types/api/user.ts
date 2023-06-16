type FeedbackObject = {
    feedback: string | null
};

type TokenIdObject = {
    token: string,
    id: number
}

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

// validate-token

export type ValidateTokenRequest = TokenIdObject;

export function isValidateTokenRequestValid(req: any): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

// get-settings

export type GetSettingsRequest = TokenIdObject;

export function isGetSettingsRequestValid(req: any): boolean {
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
    status: string,
    settings: {
        compactMode: boolean,
        condensedFont: boolean,
        aurebeshFont: boolean,
        sharpMode: boolean
    }
};

export function isSetSettingsRequestValid(req: any): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.username != undefined && typeof req.username == 'string'
        && req.username.length > 2 && req.username.length <= 32
        && req.email != undefined && typeof req.email == 'string'
        && req.passwordHash != undefined && typeof req.passwordHash == 'string'
        && (req.passwordHash.length == 128 || req.passwordHash == 0)
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

export function isSetPfpRequestValid(req: any): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number'
        && req.pfp != undefined && typeof req.pfp == 'string'
        && req.pfpType != undefined && typeof req.pfpType == 'string'
        && req.pfpType.length < 6;
}
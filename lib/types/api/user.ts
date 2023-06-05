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
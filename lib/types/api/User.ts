type ValidObject = {
    valid: boolean
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

// validate-username

export function isValidateUsernameRequestValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

export type ValidateUsernameResponse = ValidObject;

// validate-email

export function isValidateEmailRequestValid(req: any): boolean {
    return req != undefined && typeof req == 'string';
}

export type ValidateEmailResponse = ValidObject;

// confirm

export type ConfirmRequest = {
    id: number,
    verificationCode: number
};

export function isConfirmRequestValid(req: ConfirmRequest): boolean {
    return req.id != undefined && typeof req.id == 'number'
    && req.verificationCode != undefined && typeof req.verificationCode == 'number';
}

export type ConfirmResponse = TokenIdObject;

// validate-token

export type ValidateTokenRequest = TokenIdObject;

export function isValidateTokenRequestValid(req: any): boolean {
    return req.token != undefined && typeof req.token == 'string'
        && req.token.length == 128
        && req.id != undefined && typeof req.id == 'number';
}

export type ValidateTokenResponse = ValidObject;
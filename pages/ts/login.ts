import { ApiFeedbackInput, Form, Input, PasswordInput, Button } from './form.js';
import { RequireNonNull, Response, defaultStatusCode } from './utils.js';

class LoginButton extends Button {
    constructor() {
        super('Login', '/img/login.svg');
    }
}

class UsernameInput extends ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/login-username');
    }
}

const usernameInput = new UsernameInput();
const passwordInput = new PasswordInput();

const loginStatusCode = Object.assign({}, defaultStatusCode);
loginStatusCode[401] = (): void => {
    passwordInput.setError(true, 'Wrong Password!');
};
loginStatusCode[404] = (): void => {
    passwordInput.setError(true, 'No Users found with specified Username!');
};

let loginResponse: Response | undefined = undefined;

class LoginForm extends Form {
    constructor() {
        super('login-form', '/api/auth/login', 'POST', [
            usernameInput, passwordInput
        ], new LoginButton(), (res: Response): void => {
            if(res != undefined) {
                loginResponse = res;
                loginTfaForm.show(true);
                this.show(false);
            }
            else
                window.location.href = '/';
        }, loginStatusCode);
    }
}

const loginForm = new LoginForm();

class LoginTfaButton extends Button {
    constructor() {
        super('Verify', '/img/confirm.svg');
    }
}

class TfaCodeInput extends Input<number> {
    constructor() {
        super('tfaCode', 'number', '2FA Code:', 'Input 2FA Code');
    }

    async parse(): Promise<number | undefined> {
        const parsed: number = parseInt(this.input.value);
        if(!Number.isSafeInteger(parsed)) {
            this.setError(true, 'Invalid 2FA Code!');
            return undefined;
        }
        if(parsed < 100000 || parsed > 999999) {
            this.setError(true, '6 Digits needed!');
            return undefined;
        }
        this.setError(false, 'Valid 2FA Code');
        return parsed;
    }
}

const tfaCodeInput = new TfaCodeInput();

const loginTfaStatusCode = Object.assign({}, defaultStatusCode);
loginTfaStatusCode[401] = (): void => {
    tfaCodeInput.setError(true, 'Wrong 2FA Code!');
};
loginTfaStatusCode[404] = (): void => {
    tfaCodeInput.setError(true, 'No pending 2FA Actions!');
};
loginTfaStatusCode[422] = (): void => {
    tfaCodeInput.setError(true, '2FA has been disabled!');
};

class LoginTfaForm extends Form {
    constructor() {
        super('login-tfa-form', '/api/auth/login-tfa', 'POST', [
            tfaCodeInput
        ], new LoginTfaButton(), (): void => {
            window.location.href = '/';
        }, loginTfaStatusCode);
    }

    async getData(): Promise<string> {
        if(loginResponse == undefined)
            throw new Error('Login not executed, or does not require 2FA!');
        return JSON.stringify({
            tfaToken: loginResponse.tfaToken,
            tfaCode: await tfaCodeInput.parse()
        });
    }
}

const loginTfaForm = new LoginTfaForm();
loginTfaForm.show(false);
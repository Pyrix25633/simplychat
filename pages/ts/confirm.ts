import { ApiFeedbackInput, Form, Input, SubmitButton } from './form.js';
import { defaultStatusCode } from './utils.js';

class LoginButton extends SubmitButton {
    constructor() {
        super('Confirm', '/img/confirm.svg');
    }
}

class UsernameInput extends ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'Input Username', '/api/confirm-username-feedback');
    }
}

class VerificationCodeInput extends Input {
    constructor() {
        super('verificationCode', 'number', 'Verification Code:', 'Input Verification Code')
    }

    async parse(): Promise<number | void> {
        const parsed: number = parseInt(this.input.value);
        if(!Number.isSafeInteger(parsed)) {
            this.setError(true, 'Invalid Verification Code!');
            return;
        }
        if(parsed < 100000 || parsed > 999999) {
            this.setError(true, '6 Digits needed!');
            return;
        }
        this.setError(false, 'Valid Verification Code');
        return parsed;
    }
}

const usernameInput = new UsernameInput();
const verificationCodeInput = new VerificationCodeInput();

let username = localStorage.getItem('pendingConfirmUsername');
if(username == null) {
    const usernameParameterMatch = window.location.href.match(/^.+\/temp-users\/(\w+)\/confirm$/);
    if(usernameParameterMatch != null)
        username = usernameParameterMatch[1];
}
if(username != null) {
    usernameInput.input.value = username;
    usernameInput.parse();
}

const params = new URLSearchParams(window.location.search);
const verificationCode = params.get('verificationCode');
if(verificationCode != null) {
    const parsed = parseInt(verificationCode);
    if(parsed >= 100000 && parsed <= 999999) {
        verificationCodeInput.input.value = verificationCode;
        verificationCodeInput.parse();
    }
}

const loginStatusCode = Object.assign({}, defaultStatusCode);
loginStatusCode[422] = (): void => {
    verificationCodeInput.setError(true, 'Wrong Verification Code!');
};

class LoginForm extends Form {
    constructor() {
        super('confirm-form', '/api/temp-users/{username}/confirm', 'POST', [
            usernameInput, verificationCodeInput
        ], new LoginButton(), async (): Promise<void> => {
            window.location.href = '/login';
        }, loginStatusCode);
    }

    async getUrl(): Promise<string> {
        return this.url.replace('{username}', await usernameInput.parse());
    }

    async getData(): Promise<string> {
        return JSON.stringify({ verificationCode: await verificationCodeInput.parse() });
    }
}

const loginForm = new LoginForm();
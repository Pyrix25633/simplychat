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
        super('verificationCode', 'number', 'Verification Code:', 'Input Verification Code');
    }
    async parse() {
        const parsed = parseInt(this.input.value);
        if (!Number.isSafeInteger(parsed)) {
            this.setError(true, 'Invalid Verification Code!');
            return;
        }
        if (parsed < 100000 || parsed > 999999) {
            this.setError(true, '6 Digits needed!');
            return;
        }
        return parsed;
    }
}
const usernameInput = new UsernameInput();
const verificationCodeInput = new VerificationCodeInput();
let username = localStorage.getItem('pendingConfirmUsername');
if (username == null) {
    const usernameParameterMatch = window.location.href.match(/^.+\/temp-users\/(\w+)\/confirm$/);
    if (usernameParameterMatch != null)
        username = usernameParameterMatch[1];
}
if (username != null) {
    usernameInput.input.value = username;
    usernameInput.parse();
}
const loginStatusCode = Object.assign({}, defaultStatusCode);
class LoginForm extends Form {
    constructor() {
        super('confirm-form', '/api/temp-users/{username}/confirm', 'POST', [
            usernameInput, verificationCodeInput
        ], new LoginButton(), async () => {
            window.location.href = '/login';
        }, loginStatusCode);
    }
    async getUrl() {
        return this.url.replace('{username}', await usernameInput.parse());
    }
    async getData() {
        return JSON.stringify({ verificationCode: await verificationCodeInput.parse() });
    }
}
const loginForm = new LoginForm();

import { ApiFeedbackInput, Form, Input, Button } from './form.js';
import { defaultStatusCode } from './utils.js';
class ConfirmButton extends Button {
    constructor() {
        super('Confirm', '/img/confirm.svg');
    }
}
class UsernameInput extends ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/confirm-username');
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
            return undefined;
        }
        if (parsed < 100000 || parsed > 999999) {
            this.setError(true, '6 Digits needed!');
            return undefined;
        }
        this.setError(false, 'Valid Verification Code');
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
    usernameInput.set('username');
}
const params = new URLSearchParams(window.location.search);
const verificationCode = params.get('verificationCode');
if (verificationCode != null) {
    const parsed = parseInt(verificationCode);
    if (parsed >= 100000 && parsed <= 999999) {
        verificationCodeInput.input.value = verificationCode;
        verificationCodeInput.parse();
    }
}
const confirmStatusCode = Object.assign({}, defaultStatusCode);
confirmStatusCode[422] = () => {
    verificationCodeInput.setError(true, 'Wrong Verification Code!');
};
class ConfirmForm extends Form {
    constructor() {
        super('confirm-form', '/api/temp-users/{username}/confirm', 'POST', [
            usernameInput, verificationCodeInput
        ], new ConfirmButton(), () => {
            window.location.href = '/login';
        }, confirmStatusCode);
    }
    async getUrl() {
        const username = await usernameInput.parse();
        if (username === undefined)
            throw new Error('Username not valid!');
        return this.url.replace('{username}', username);
    }
    async getData() {
        return JSON.stringify({ verificationCode: await verificationCodeInput.parse() });
    }
}
const confirmForm = new ConfirmForm();

import { ApiFeedbackInput, Button, Form, Input } from './form.js';
import { defaultStatusCode } from './utils.js';
class VerificationCodeInput extends Input {
    constructor() {
        super('verificationCode', 'number', 'Verification Code:', 'Input Verification Code');
        this.input.classList.add('medium');
    }
    async parse() {
        const verificationCode = parseInt(this.input.value);
        if (!Number.isSafeInteger(verificationCode)) {
            this.setError(true, 'Invalid Verification Code!');
            return undefined;
        }
        if (verificationCode < 100000 || verificationCode > 999999) {
            this.setError(true, '6 Digits needed!');
            return undefined;
        }
        this.setError(false, 'Valid Verification Code');
        return verificationCode;
    }
}
const usernameInput = new ApiFeedbackInput('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/confirm-username');
const verificationCodeInput = new VerificationCodeInput();
const pendingConfirmUsernameKey = 'pendingConfirmUsername';
let username = localStorage.getItem(pendingConfirmUsernameKey);
if (username == null) {
    const usernameParameterMatch = window.location.href.match(/^.+\/temp-users\/(\w+)\/confirm.*$/);
    if (usernameParameterMatch != null)
        username = usernameParameterMatch[1];
}
if (username != null) {
    usernameInput.set(username);
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
        ], new Button('Confirm', '/img/confirm.svg'), () => {
            if (username == localStorage.getItem(pendingConfirmUsernameKey))
                localStorage.removeItem(pendingConfirmUsernameKey);
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

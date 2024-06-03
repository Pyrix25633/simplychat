import { ApiFeedbackInput, Button, Form, Input, PasswordInput } from './form.js';
import { defaultStatusCode, pendingActionKey } from './utils.js';
const usernameInput = new ApiFeedbackInput('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/login-username');
const passwordInput = new PasswordInput();
const loginStatusCode = Object.assign({}, defaultStatusCode);
loginStatusCode[401] = () => {
    passwordInput.setError(true, 'Wrong Password!');
};
loginStatusCode[404] = () => {
    passwordInput.setError(true, 'No Users found with specified Username!');
};
let loginResponse = undefined;
function navigateToPendingActionOrIndex() {
    const pendingAction = localStorage.getItem(pendingActionKey);
    if (pendingAction != null) {
        localStorage.removeItem(pendingActionKey);
        window.location.href = pendingAction;
    }
    else
        window.location.href = '/';
}
class LoginForm extends Form {
    constructor() {
        super('login-form', '/api/auth/login', 'POST', [
            usernameInput, passwordInput
        ], new Button('Login', '/img/login.svg'), (res) => {
            if (res != undefined) {
                loginResponse = res;
                loginTfaForm.show(true);
                this.show(false);
            }
            else
                navigateToPendingActionOrIndex();
        }, loginStatusCode, 'username-password');
    }
}
const loginForm = new LoginForm();
class TfaCodeInput extends Input {
    constructor() {
        super('tfaCode', 'number', '2FA Code:', 'Input 2FA Code');
        this.input.classList.add('medium');
    }
    async parse() {
        const text = this.input.value.replace(' ', '');
        const parsed = parseInt(this.input.value);
        if (!Number.isSafeInteger(parsed)) {
            this.setError(true, 'Invalid 2FA Code!');
            return undefined;
        }
        if (text.length != 6) {
            this.setError(true, '6 Digits needed!');
            return undefined;
        }
        this.setError(false, 'Valid 2FA Code');
        return parsed;
    }
}
const tfaCodeInput = new TfaCodeInput();
const loginTfaStatusCode = Object.assign({}, defaultStatusCode);
loginTfaStatusCode[401] = () => {
    tfaCodeInput.setError(true, 'Wrong 2FA Code!');
};
loginTfaStatusCode[404] = () => {
    tfaCodeInput.setError(true, 'No pending 2FA Actions!');
};
loginTfaStatusCode[422] = () => {
    tfaCodeInput.setError(true, '2FA has been disabled!');
};
class LoginTfaForm extends Form {
    constructor() {
        super('login-tfa-form', '/api/auth/login-tfa', 'POST', [
            tfaCodeInput
        ], new Button('Verify', '/img/confirm.svg'), () => {
            navigateToPendingActionOrIndex();
        }, loginTfaStatusCode, 'tfa');
    }
    async getData() {
        if (loginResponse == undefined)
            throw new Error('Login not executed, or does not require 2FA!');
        return JSON.stringify({
            tfaToken: loginResponse.tfaToken,
            tfaCode: await tfaCodeInput.parse()
        });
    }
}
const loginTfaForm = new LoginTfaForm();
loginTfaForm.show(false);

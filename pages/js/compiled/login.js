import { ApiFeedbackInput, Form, Input, PasswordInput, SubmitButton } from './form.js';
import { RequireNonNull, defaultStatusCode } from './utils.js';
const usernamePasswordDiv = RequireNonNull.getElementById('username-password');
const tfaDiv = RequireNonNull.getElementById('tfa');
tfaDiv.style.display = 'none';
class LoginButton extends SubmitButton {
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
loginStatusCode[401] = () => {
};
class LoginForm extends Form {
    constructor() {
        super('login-form', '/api/auth/login', 'POST', [
            usernameInput, passwordInput
        ], new LoginButton(), (res) => {
            if (res != undefined) {
                class LoginTfaButton extends SubmitButton {
                    constructor() {
                        super('Verify', '/img/confirm.svg');
                    }
                }
                class TfaCodeInput extends Input {
                    constructor() {
                        super('tfaCode', 'number', '2FA Code:', 'Input 2FA Code');
                    }
                    async parse() {
                        const parsed = parseInt(this.input.value);
                        if (!Number.isSafeInteger(parsed)) {
                            this.setError(true, 'Invalid 2FA Code!');
                            return;
                        }
                        if (parsed < 100000 || parsed > 999999) {
                            this.setError(true, '6 Digits needed!');
                            return;
                        }
                        this.setError(false, 'Valid 2FA Code');
                        return parsed;
                    }
                }
                const tfaCodeInput = new TfaCodeInput();
                const loginTfaStatusCode = Object.assign({}, defaultStatusCode);
                loginTfaStatusCode[401] = () => {
                };
                class LoginTfaForm extends Form {
                    constructor() {
                        super('login-tfa-form', '/api/auth/login-tfa', 'POST', [
                            tfaCodeInput
                        ], new LoginTfaButton(), () => {
                            window.location.href = '/';
                        }, loginTfaStatusCode);
                    }
                    async getData() {
                        return JSON.stringify({
                            tfaToken: res.tfaToken,
                            tfaCode: await tfaCodeInput.parse()
                        });
                    }
                }
                const loginTfaForm = new LoginTfaForm();
                usernamePasswordDiv.style.display = 'none';
                tfaDiv.style.display = '';
            }
            else
                window.location.href = '/';
        }, loginStatusCode);
    }
}
const loginForm = new LoginForm();

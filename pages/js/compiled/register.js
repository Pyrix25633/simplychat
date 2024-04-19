"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const form_js_1 = require("./form.js");
const utils_js_1 = require("./utils.js");
class LoginButton extends form_js_1.SubmitButton {
    constructor() {
        super('Register', '/img/register.svg');
    }
}
class UsernameInput extends form_js_1.ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'Input Username', '/api/register-username-feedback');
    }
}
class EmailInput extends form_js_1.ApiFeedbackInput {
    constructor() {
        super('email', 'text', 'Email:', 'Input Email', '/api/register-email-feedback');
    }
}
class PasswordInput extends form_js_1.Input {
    constructor() {
        super('password', 'password', 'Password:', 'Input Password');
    }
    async parse() {
        if (this.input.value.length < 8) {
            this.setError(true, 'At least 8 Characters needed!');
            return;
        }
        let digits = 0, symbols = 0;
        for (let i = 0; i < this.input.value.length; i++) {
            const c = this.input.value.codePointAt(i);
            if (c == undefined)
                break;
            if (c >= 48 && c <= 57)
                digits++;
            else if ((c >= 45 && c <= 47) || c == 35 || c == 64 || c == 42 || c == 95)
                symbols++;
            else if (!((c >= 97 && c <= 122) || (c >= 65 && c <= 90))) {
                this.setError(true, 'Invalid Character: ' + String.fromCodePoint(c) + '!');
                return;
            }
        }
        if (digits < 2) {
            this.setError(true, 'At least 2 Digits needed!');
            return;
        }
        if (symbols < 1) {
            this.setError(true, 'At least 1 Symbol needed!');
            return;
        }
        this.setError(false, 'Valid Password');
        return this.input.value;
    }
}
const usernameInput = new UsernameInput();
const emailInput = new EmailInput();
const passwordInput = new PasswordInput();
const loginStatusCode = Object.assign({}, utils_js_1.defaultStatusCode);
class LoginForm extends form_js_1.Form {
    constructor() {
        super('register-form', '/api/temp-users', 'POST', [
            usernameInput, emailInput, passwordInput
        ], new LoginButton(), () => {
            window.location.href = '/temp-users/' + usernameInput.parse() + '/confirm';
        }, loginStatusCode);
    }
}
const loginForm = new LoginForm();

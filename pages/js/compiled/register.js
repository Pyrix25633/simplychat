import { ApiFeedbackInput, Form, PasswordInput, SubmitButton } from './form.js';
import { defaultStatusCode } from './utils.js';
class RegisterButton extends SubmitButton {
    constructor() {
        super('Register', '/img/register.svg');
    }
}
class UsernameInput extends ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/register-username');
    }
}
class EmailInput extends ApiFeedbackInput {
    constructor() {
        super('email', 'text', 'Email:', 'Input Email', '/api/feedbacks/register-email');
    }
}
const usernameInput = new UsernameInput();
const emailInput = new EmailInput();
const passwordInput = new PasswordInput();
const registerStatusCode = Object.assign({}, defaultStatusCode);
class RegisterForm extends Form {
    constructor() {
        super('register-form', '/api/temp-users', 'POST', [
            usernameInput, emailInput, passwordInput
        ], new RegisterButton(), (res) => {
            localStorage.setItem('pendingConfirmUsername', res.username);
            window.location.href = '/temp-users/' + res.username + '/confirm';
        }, registerStatusCode);
    }
}
const registerForm = new RegisterForm();

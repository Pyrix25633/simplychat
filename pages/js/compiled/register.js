import { ApiFeedbackInput, Button, Form, PasswordInput } from './form.js';
import { defaultStatusCode } from './utils.js';
const usernameInput = new ApiFeedbackInput('username', 'text', 'Username:', 'Input Username', '/api/feedbacks/register-username');
const emailInput = new ApiFeedbackInput('email', 'text', 'Email:', 'Input Email', '/api/feedbacks/register-email');
const passwordInput = new PasswordInput();
const registerStatusCode = Object.assign({}, defaultStatusCode);
class RegisterForm extends Form {
    constructor() {
        super('register-form', '/api/temp-users', 'POST', [
            usernameInput, emailInput, passwordInput
        ], new Button('Register', '/img/register.svg'), (res) => {
            localStorage.setItem('pendingConfirmUsername', res.username);
            window.location.href = '/temp-users/' + res.username + '/confirm';
        }, registerStatusCode);
    }
}
const registerForm = new RegisterForm();

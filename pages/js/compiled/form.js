import { RequireNonNull } from './utils.js';
export class Form {
    constructor(id, url, method, inputs, submitButton, success, statusCode) {
        this.valid = false;
        this.url = url;
        this.method = method;
        this.form = RequireNonNull.getElementById(id);
        this.inputs = inputs;
        for (const input of inputs)
            input.appendTo(this);
        this.submitButton = submitButton;
        this.submitButton.appendTo(this);
        this.submitButton.addClickListener(() => { this.submit(); });
        this.success = success;
        this.statusCode = statusCode;
    }
    appendChild(node) {
        this.form.appendChild(node);
    }
    validate() {
        this.valid = true;
        for (const input of this.inputs)
            this.valid = this.valid && !input.getError();
        this.submitButton.setDisabled(!this.valid);
    }
    async getUrl() {
        return this.url;
    }
    async getData() {
        const data = {};
        for (const input of this.inputs)
            data[input.id] = await input.parse();
        return this.method == 'GET' ? data : JSON.stringify(data);
    }
    async submit() {
        $.ajax({
            url: await this.getUrl(),
            method: this.method,
            data: await this.getData(),
            contentType: 'application/json',
            success: this.success,
            statusCode: this.statusCode
        });
    }
}
export class SubmitButton {
    constructor(text, iconSrc) {
        this.button = document.createElement('button');
        this.button.innerText = text;
        this.button.disabled = true;
        const icon = document.createElement('img');
        icon.classList.add('button');
        icon.src = iconSrc;
        icon.alt = text + ' Icon';
        this.button.appendChild(icon);
    }
    appendTo(form) {
        const div = document.createElement('div');
        div.classList.add('container');
        div.appendChild(this.button);
        form.appendChild(div);
    }
    addClickListener(listener) {
        this.button.addEventListener('click', listener);
    }
    setDisabled(disabled) {
        this.button.disabled = disabled;
    }
    isDisabled() {
        return this.button.disabled;
    }
}
export class Input {
    constructor(id, type, labelText, feedbackText) {
        this.form = undefined;
        this.timeout = undefined;
        this.error = true;
        this.id = id;
        this.input = document.createElement('input');
        this.input.id = id;
        this.input.type = type;
        this.feedback = document.createElement('span');
        this.feedback.classList.add('text');
        this.feedback.innerText = feedbackText;
        this.labelText = labelText;
        this.input.addEventListener('keyup', () => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.parse();
            }, 1000);
        });
        this.input.addEventListener('keydown', () => {
            clearTimeout(this.timeout);
        });
        this.input.addEventListener('focusout', () => {
            clearTimeout(this.timeout);
            this.parse();
        });
        this.input.addEventListener('change', () => {
            this.parse();
        });
    }
    appendTo(form) {
        this.form = form;
        const container = document.createElement('div');
        container.classList.add('container');
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.innerText = this.labelText;
        container.appendChild(label);
        container.appendChild(this.input);
        this.form.appendChild(container);
        this.form.appendChild(this.feedback);
        setTimeout(() => {
            if (this.input.value != '')
                this.parse();
        }, 250);
    }
    setError(error, feedbackText) {
        var _a;
        this.error = error;
        if (!this.feedback.classList.contains('error') && !this.feedback.classList.contains('success'))
            this.feedback.classList.add('error');
        if (this.error)
            this.feedback.classList.replace('success', 'error');
        else
            this.feedback.classList.replace('error', 'success');
        this.feedback.innerText = feedbackText;
        (_a = this.form) === null || _a === void 0 ? void 0 : _a.validate();
    }
    getError() {
        return this.error;
    }
}
export class PasswordInput extends Input {
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
export class ApiFeedbackInput extends Input {
    constructor(id, type, labelText, feedbackText, url) {
        super(id, type, labelText, feedbackText);
        this.url = url;
    }
    getInputValue() {
        return this.input.value;
    }
    async parse() {
        const data = {};
        data[this.id] = this.getInputValue();
        return new Promise((resolve) => {
            $.ajax({
                url: this.url,
                method: 'GET',
                data: data,
                success: (res) => {
                    this.setError(res.feedback.includes('!'), res.feedback);
                    resolve(this.getInputValue());
                },
                error: (req, err) => {
                    console.error(err);
                    this.setError(true, 'Server unreachable!');
                    resolve(null);
                }
            });
        });
    }
}

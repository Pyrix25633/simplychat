import { RequireNonNull } from './utils.js';
export class Form {
    constructor(id, url, method, inputs, submitButton, success, statusCode, wrapperId = undefined) {
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
        this.wrapper = wrapperId != undefined ? RequireNonNull.getElementById(wrapperId) : undefined;
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
        const data = await this.getData();
        if (!this.valid)
            return;
        $.ajax({
            url: await this.getUrl(),
            method: this.method,
            data: data,
            contentType: 'application/json',
            success: this.success,
            statusCode: this.statusCode
        });
    }
    show(show) {
        if (this.wrapper != undefined)
            this.wrapper.style.display = show ? '' : 'none';
        else
            this.form.style.display = show ? '' : 'none';
        this.submitButton.show(show);
    }
}
export class Button {
    constructor(text, iconSrc, inFooter = false) {
        this.button = document.createElement('button');
        this.button.innerText = text;
        this.button.disabled = true;
        const icon = document.createElement('img');
        icon.classList.add('button');
        icon.src = iconSrc;
        icon.alt = text + ' Icon';
        this.button.appendChild(icon);
        this.inFooter = inFooter;
    }
    appendTo(form) {
        if (this.inFooter) {
            form.appendChild(this.button);
        }
        else {
            const div = document.createElement('div');
            div.classList.add('container');
            div.appendChild(this.button);
            form.appendChild(div);
        }
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
    show(show) {
        this.button.style.display = show ? '' : 'none';
    }
}
class CancelButton extends Button {
    constructor() {
        super('Cancel', '/img/cancel.svg', true);
        this.addClickListener(() => {
            window.location.href = '/';
        });
    }
}
export class StructuredForm extends Form {
    constructor(id, url, method, inputs, submitButton, success, statusCode, precompileUrl = null) {
        super(id, url, method, inputs, submitButton, success, statusCode);
        this.footer = undefined;
        this.cancelButton = new CancelButton();
        this.cancelButton.appendTo(this);
        if (precompileUrl != null) {
            $.ajax({
                url: precompileUrl,
                method: 'GET',
                contentType: 'application/json',
                success: (res) => {
                    this.precompile(res);
                }
            });
        }
    }
    appendChild(node) {
        if (this.footer == undefined)
            this.footer = RequireNonNull.getElementById('footer');
        ;
        if (node instanceof HTMLButtonElement)
            this.footer.appendChild(node);
        else
            super.appendChild(node);
    }
    precompile(res) { }
    show(show) {
        super.show(show);
        this.cancelButton.show(show);
    }
}
export class InputElement {
    constructor(id) {
        this.id = id;
    }
    set(value) {
        throw new Error('Method not implemented!');
    }
}
export class Input extends InputElement {
    constructor(id, type, labelText, feedbackText) {
        super(id);
        this.formOrSection = undefined;
        this.timeout = undefined;
        this.error = true;
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
    appendTo(formOrSection) {
        this.formOrSection = formOrSection;
        const container = document.createElement('div');
        container.classList.add('container');
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.innerText = this.labelText;
        container.appendChild(label);
        container.appendChild(this.input);
        this.formOrSection.appendChild(container);
        this.formOrSection.appendChild(this.feedback);
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
        if (this.formOrSection != undefined)
            (_a = this.formOrSection) === null || _a === void 0 ? void 0 : _a.validate();
    }
    getError() {
        return this.error;
    }
    getInputValue() {
        return this.input.value;
    }
    setInputValue(value) {
        this.input.value = value;
    }
}
export class PasswordInput extends Input {
    constructor() {
        super('password', 'password', 'Password:', 'Input Password');
    }
    async parse() {
        if (this.input.value.length < 8) {
            this.setError(true, 'At least 8 Characters needed!');
            return undefined;
        }
        let digits = 0, symbols = 0;
        for (let i = 0; i < this.input.value.length; i++) {
            const c = this.input.value.codePointAt(i);
            if (c == undefined)
                break;
            if (c >= 48 && c <= 57)
                digits++;
            else if ((c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126))
                symbols++;
            else if (!((c >= 97 && c <= 122) || (c >= 65 && c <= 90))) {
                this.setError(true, 'Invalid Character: ' + String.fromCodePoint(c) + '!');
                return undefined;
            }
        }
        if (digits < 2) {
            this.setError(true, 'At least 2 Digits needed!');
            return undefined;
        }
        if (symbols < 1) {
            this.setError(true, 'At least 1 Symbol needed!');
            return undefined;
        }
        this.setError(false, 'Valid Password');
        return this.input.value;
    }
    set(value) {
        this.input.value = value;
        this.parse();
    }
}
export class ApiFeedbackInput extends Input {
    constructor(id, type, labelText, feedbackText, url) {
        super(id, type, labelText, feedbackText);
        this.url = url;
    }
    set(value) {
        this.input.value = value;
        this.parse();
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
                    resolve(undefined);
                }
            });
        });
    }
}
export class InputSection extends InputElement {
    constructor(title, inputs) {
        super('');
        this.form = undefined;
        this.error = true;
        this.title = title;
        this.inputs = inputs;
        this.section = document.createElement('div');
        this.section.classList.add('box', 'section');
        const h3 = document.createElement('h3');
        h3.innerText = this.title;
        this.section.appendChild(h3);
        for (const input of inputs)
            input.appendTo(this);
    }
    appendChild(node) {
        this.section.appendChild(node);
    }
    appendTo(form) {
        this.form = form;
        form.appendChild(this.section);
    }
    getError() {
        return this.error;
    }
    validate() {
        var _a;
        this.error = false;
        for (const input of this.inputs)
            this.error = this.error || input.getError();
        (_a = this.form) === null || _a === void 0 ? void 0 : _a.validate();
    }
}

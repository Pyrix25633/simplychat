import { RequireNonNull, StatusCode, Success } from './utils.js';

export abstract class Form {
    protected readonly url: string;
    private readonly method: string;
    private readonly form: HTMLElement;
    private readonly inputs: Input[];
    private readonly submitButton: SubmitButton;
    private readonly success: Success;
    private readonly statusCode: StatusCode;
    private valid: boolean = false;

    constructor(id: string, url: string, method: string, inputs: Input[], submitButton: SubmitButton, success: Success, statusCode: StatusCode) {
        this.url = url;
        this.method = method;
        this.form = RequireNonNull.getElementById(id);
        this.inputs = inputs;
        for(const input of inputs)
            input.appendTo(this);
        this.submitButton = submitButton;
        this.submitButton.appendTo(this);
        this.submitButton.addClickListener((): void => { this.submit(); });
        this.success = success;
        this.statusCode = statusCode;
    }

    appendChild(node: HTMLElement): void {
        this.form.appendChild(node);
    }

    validate(): void {
        this.valid = true;
        for(const input of this.inputs)
            this.valid = this.valid && !input.getError();
        this.submitButton.setDisabled(!this.valid);
    }

    async getUrl(): Promise<string> {
        return this.url;
    }

    async getData(): Promise<string | { [index: string]: any; }> {
        const data: { [index: string]: any } = {};
        for(const input of this.inputs)
            data[input.id] = await input.parse();
        return this.method == 'GET' ? data : JSON.stringify(data);
    }

    async submit(): Promise<void> {
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

export abstract class SubmitButton {
    private readonly button: HTMLButtonElement;

    constructor(text: string, iconSrc: string) {
        this.button = document.createElement('button');
        this.button.innerText = text;
        this.button.disabled = true;
        const icon = document.createElement('img');
        icon.classList.add('button');
        icon.src = iconSrc;
        icon.alt = text + ' Icon';
        this.button.appendChild(icon);
    }

    appendTo(form: Form) {
        const div = document.createElement('div');
        div.classList.add('container');
        div.appendChild(this.button);
        form.appendChild(div);
    }

    addClickListener(listener: () => void): void {
        this.button.addEventListener('click', listener);
    }

    setDisabled(disabled: boolean): void {
        this.button.disabled = disabled;
    }

    isDisabled(): boolean {
        return this.button.disabled;
    }
}

export abstract class Input {
    public readonly id: string;
    private form: Form | undefined = undefined;
    public input: HTMLInputElement;
    private feedback: HTMLSpanElement;
    private labelText: string;
    private timeout: NodeJS.Timeout | undefined = undefined;
    private error: boolean = true;

    constructor(id: string, type: string, labelText: string, feedbackText: string) {
        this.id = id;
        this.input = document.createElement('input');
        this.input.id = id;
        this.input.type = type;
        this.feedback = document.createElement('span');
        this.feedback.classList.add('text');
        this.feedback.innerText = feedbackText;
        this.labelText = labelText;
        this.input.addEventListener('keyup', (): void => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout((): void => {
                this.parse();
            }, 1000);
        });
        this.input.addEventListener('keydown', (): void => {
            clearTimeout(this.timeout);
        });
        this.input.addEventListener('focusout', (): void => {
            clearTimeout(this.timeout);
            this.parse();
        });
        this.input.addEventListener('change', (): void => {
            this.parse();
        });
    }

    appendTo(form: Form): void {
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
        setTimeout((): void => {
            if(this.input.value != '') this.parse();
        }, 250);
    }

    abstract parse(): Promise<any>;

    setError(error: boolean, feedbackText: string): void {
        this.error = error;
        if(!this.feedback.classList.contains('error') && !this.feedback.classList.contains('success'))
            this.feedback.classList.add('error');
        if(this.error)
            this.feedback.classList.replace('success', 'error');
        else
            this.feedback.classList.replace('error', 'success');
        this.feedback.innerText = feedbackText;
        this.form?.validate();
    }

    getError(): boolean {
        return this.error;
    }
}

export class PasswordInput extends Input {
    constructor() {
        super('password', 'password', 'Password:', 'Input Password')
    }

    async parse(): Promise<string | void> {
        if(this.input.value.length < 8) {
            this.setError(true, 'At least 8 Characters needed!');
            return;
        }
        let digits = 0, symbols = 0;
        for(let i = 0; i < this.input.value.length; i++) {
            const c: number | undefined = this.input.value.codePointAt(i);
            if(c == undefined) break;
            if(c >= 48 && c <= 57) digits++;
            else if((c >= 45 && c <= 47) || c == 35 || c == 64 || c == 42 || c == 95) symbols++;
            else if(!((c >= 97 && c <= 122) || (c >= 65 && c <= 90))) {
                this.setError(true, 'Invalid Character: ' + String.fromCodePoint(c) + '!');
                return;
            }
        }
        if(digits < 2) {
            this.setError(true, 'At least 2 Digits needed!');
            return;
        }
        if(symbols < 1) {
            this.setError(true, 'At least 1 Symbol needed!');
            return;
        }
        this.setError(false, 'Valid Password');
        return this.input.value;
    }
}

export abstract class ApiFeedbackInput extends Input {
    private readonly url: string;

    constructor(id: string, type: string, labelText: string, feedbackText: string, url: string) {
        super(id, type, labelText, feedbackText);
        this.url = url;
    }

    getInputValue(): any {
        return this.input.value;
    }

    async parse(): Promise<any> {
        const data: { [index: string]: any; } = {};
        data[this.id] = this.getInputValue();
        return new Promise((resolve): void => {
            $.ajax({
                url: this.url,
                method: 'GET',
                data: data,
                success: (res: { feedback: string; }) => {
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
import { RequireNonNull, StatusCode, Success } from './utils.js';

type JsonObject = { [index: string]: any; };

export abstract class Form {
    protected readonly url: string;
    private readonly method: string;
    private readonly form: HTMLElement;
    private readonly inputs: InputElement<any>[];
    private readonly submitButton: Button;
    private readonly success: Success;
    private readonly statusCode: StatusCode;
    private readonly wrapper: HTMLDivElement | undefined;
    private valid: boolean = false;

    constructor(id: string, url: string, method: string, inputs: InputElement<any>[], submitButton: Button,
                success: Success, statusCode: StatusCode, wrapperId: string| undefined = undefined) {
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
        this.wrapper = wrapperId != undefined ? RequireNonNull.getElementById(wrapperId) as HTMLDivElement : undefined;
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

    async getData(): Promise<string | JsonObject> {
        const data: { [index: string]: any } = {};
        for(const input of this.inputs)
            data[input.id] = await input.parse();
        return this.method == 'GET' ? data : JSON.stringify(data);
    }

    async submit(): Promise<void> {
        const data = await this.getData();
        if(!this.valid) return;
        $.ajax({
            url: await this.getUrl(),
            method: this.method,
            data: data,
            contentType: 'application/json',
            success: this.success,
            statusCode: this.statusCode
        });
    }

    show(show: boolean): void {
        if(this.wrapper != undefined)
            this.wrapper.style.display = show ? '' : 'none';
        else
            this.form.style.display = show ? '' : 'none';
        this.submitButton.show(show);
    }
}

export abstract class Button {
    protected readonly button: HTMLButtonElement;
    private readonly inFooter: boolean;

    constructor(text: string, iconSrc: string, inFooter: boolean = false) {
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

    appendTo(form: Form) {
        if(this.inFooter) {
            form.appendChild(this.button);
        }
        else {
            const div = document.createElement('div');
            div.classList.add('container', 'label-input');
            div.appendChild(this.button);
            form.appendChild(div);
        }
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

    show(show: boolean): void {
        this.button.style.display = show ? '' : 'none';
    }
}

class CancelButton extends Button {
    constructor() {
        super('Cancel', '/img/cancel.svg', true);
        this.addClickListener((): void => {
            window.location.href = '/';
        });
    }
}

export abstract class StructuredForm extends Form {
    private footer: HTMLDivElement | undefined = undefined;
    private readonly cancelButton: Button;

    constructor(id: string, url: string, method: string, inputs: InputElement<any>[], submitButton: Button,
                success: Success, statusCode: StatusCode, wrapperId: string | undefined = undefined, precompileUrl: string | undefined = undefined) {
        super(id, url, method, inputs, submitButton, success, statusCode, wrapperId);
        this.cancelButton = new CancelButton();
        this.cancelButton.appendTo(this);
        if(precompileUrl != undefined) {
            $.ajax({
                url: precompileUrl,
                method: 'GET',
                contentType: 'application/json',
                success: (res: Response): void => {
                    this.precompile(res);
                }
            });
        }
    }

    appendChild(node: HTMLElement): void {
        if(this.footer == undefined)
            this.footer = RequireNonNull.getElementById('footer') as HTMLDivElement;;
        if(node instanceof HTMLButtonElement)
            this.footer.appendChild(node);
        else
            super.appendChild(node);
    }

    precompile(res: Response): void {}

    show(show: boolean): void {
        super.show(show);
        this.cancelButton.show(show);
    }
}

export abstract class InputElement<T> {
    public readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    abstract appendTo(formOrSection: Form | InputSection): void;

    set(value: T): void {
        throw new Error('Method not implemented!');
    }

    abstract parse(): Promise<T | undefined>;

    abstract getError(): boolean;
}

export abstract class Input<T> extends InputElement<T> {
    private formOrSection: Form | InputSection | undefined = undefined;
    public readonly input: HTMLInputElement;
    private readonly feedback: HTMLSpanElement;
    private readonly labelText: string;
    private timeout: NodeJS.Timeout | undefined = undefined;
    private error: boolean = true;

    constructor(id: string, type: string, labelText: string, feedbackText: string) {
        super(id);
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

    appendTo(formOrSection: Form | InputSection): void {
        this.formOrSection = formOrSection;
        const container = document.createElement('div');
        container.classList.add('container', 'label-input');
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.innerText = this.labelText;
        container.appendChild(label);
        container.appendChild(this.input);
        this.formOrSection.appendChild(container);
        this.formOrSection.appendChild(this.feedback);
        setTimeout((): void => {
            if(this.input.value != '') this.parse();
        }, 250);
    }

    setError(error: boolean, feedbackText: string): void {
        this.error = error;
        if(!this.feedback.classList.contains('error') && !this.feedback.classList.contains('success'))
            this.feedback.classList.add('error');
        if(this.error)
            this.feedback.classList.replace('success', 'error');
        else
            this.feedback.classList.replace('error', 'success');
        this.feedback.innerText = feedbackText;
        if(this.formOrSection != undefined) 
        this.formOrSection?.validate();
    }

    getError(): boolean {
        return this.error;
    }

    getInputValue(): string {
        return this.input.value;
    }

    setInputValue(value: string): void {
        this.input.value = value;
    }
}

export class PasswordInput extends Input<string> {
    constructor() {
        super('password', 'password', 'Password:', 'Input Password')
    }

    async parse(): Promise<string | undefined> {
        if(this.input.value.length < 8) {
            this.setError(true, 'At least 8 Characters needed!');
            return undefined;
        }
        let digits = 0, symbols = 0;
        for(let i = 0; i < this.input.value.length; i++) {
            const c: number | undefined = this.input.value.codePointAt(i);
            if(c == undefined) break;
            if(c >= 48 && c <= 57) digits++;
            else if((c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126)) symbols++;
            else if(!((c >= 97 && c <= 122) || (c >= 65 && c <= 90))) {
                this.setError(true, 'Invalid Character: ' + String.fromCodePoint(c) + '!');
                return undefined;
            }
        }
        if(digits < 2) {
            this.setError(true, 'At least 2 Digits needed!');
            return undefined;
        }
        if(symbols < 1) {
            this.setError(true, 'At least 1 Symbol needed!');
            return undefined;
        }
        this.setError(false, 'Valid Password');
        return this.input.value;
    }

    set(value: string): void {
        this.input.value = value;
        this.parse();
    }
}

export class BooleanInput extends InputElement<boolean> {
    private readonly labelText: string;
    private readonly slider: HTMLDivElement;
    private readonly feedback: HTMLSpanElement;
    private formOrSection: Form | InputSection | undefined = undefined;

    constructor(id: string, labelText: string, feedbackText: string) {
        super(id);
        this.labelText = labelText;
        this.slider = document.createElement('div');
        this.slider.id = this.id;
        this.slider.classList.add('slider', 'off');
        this.slider.addEventListener('click', async (): Promise<void> => {
            this.set(!(await this.parse()));
        });
        const sliderCircle = document.createElement('div');
        sliderCircle.classList.add('slider-circle');
        this.slider.appendChild(sliderCircle);
        this.feedback = document.createElement('span');
        this.feedback.classList.add('text');
        this.feedback.innerText = feedbackText;
    }

    appendTo(formOrSection: Form | InputSection): void {
        this.formOrSection = formOrSection;
        const container = document.createElement('div');
        container.classList.add('container', 'label-input');
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.innerText = this.labelText;
        container.appendChild(label);
        container.appendChild(this.slider);
        this.formOrSection.appendChild(container);
        this.formOrSection.appendChild(this.feedback);
    }

    getError(): boolean {
        return false;
    }

    async parse(): Promise<boolean> {
        return this.slider.classList.contains('on');
    }

    set(value: boolean): void {
        if(value)
            this.slider.classList.replace('off', 'on');
        else
            this.slider.classList.replace('on', 'off');
    }
}

export abstract class ApiFeedbackInput extends Input<string> {
    private readonly url: string;

    constructor(id: string, type: string, labelText: string, feedbackText: string, url: string) {
        super(id, type, labelText, feedbackText);
        this.url = url;
    }

    set(value: string): void {
        this.input.value = value;
        this.parse();
    }

    async parse(): Promise<string | undefined> {
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
                    resolve(undefined);
                }
            });
        });
    }
}

export abstract class InputSection extends InputElement<JsonObject> {
    private readonly title: string;
    private readonly inputs: InputElement<any>[];
    private readonly section: HTMLDivElement;
    private form: Form | undefined = undefined;
    private error: boolean = true;

    constructor(title: string, inputs: InputElement<any>[]) {
        super('');
        this.title = title;
        this.inputs = inputs;

        this.section = document.createElement('div');
        this.section.classList.add('box', 'section');
        const h3 = document.createElement('h3');
        h3.innerText = this.title;
        this.section.appendChild(h3);
        for(const input of inputs)
            input.appendTo(this);
    }

    appendChild(node: HTMLElement): void {
        this.section.appendChild(node);
    }

    appendTo(form: Form): void {
        this.form = form;
        form.appendChild(this.section);
    }

    getError(): boolean {
        return this.error;
    }

    validate(): void {
        this.error = false;
        for(const input of this.inputs)
            this.error = this.error || input.getError();
        this.form?.validate();
    }
}
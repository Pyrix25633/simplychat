import { ApiCallButton, ApiFeedbackInput, BooleanInput, Button, Form, ImageInput, InfoSpan, Input, InputElement, InputSection, PasswordInput, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { CssManager, CssSettings, Response, defaultStatusCode } from "./utils.js";

await loadSettings();

class ContinueButton extends Button {
    constructor() {
        super('Continue', '/img/continue.svg', true);
    }
}

class PfpInput extends ImageInput {
    constructor() {
        super('pfp', 'Profile Picture', 'You can change your Profile Picture');
    }
}

const pfpInput = new PfpInput();

class UsernameInput extends ApiFeedbackInput {
    constructor() {
        super('username', 'text', 'Username:', 'You can change your Username', '/api/feedbacks/register-username');
    }
}

class EmailInput extends ApiFeedbackInput {
    constructor() {
        super('email', 'text', 'Email:', 'You can change your Email', '/api/feedbacks/register-email');
    }
}

class StatusInput extends Input<string> {
    constructor() {
        super('status', 'text', 'Status:', 'You can change your Status');
    }

    async parse(): Promise<string | undefined> {
        const status = this.getInputValue();
        if(status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
        if(status.length < 3) {
            this.setError(true, 'Status too short!');
            return undefined;
        }
        if(status.length > 64) {
            this.setError(true, 'Status too long!');
            return undefined;
        }
        this.setError(false, 'Valid Status');
        return status;
    }
}

const idInfoSpan = new InfoSpan('Id:');
const usernameInput = new UsernameInput();
const emailInput = new EmailInput();
const statusInput = new StatusInput();

class InfoSection extends InputSection {
    constructor() {
        super('Info', [idInfoSpan, usernameInput, emailInput, statusInput]);
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            status: await statusInput.parse()
        };
    }
}

class LogoutButton extends ApiCallButton {
    constructor() {
        super('Logout', '/img/logout.svg', 'Logs you out of this Device', '/api/auth/logout', (res: Response): void => {
            location.href = '/login';
        });
    }
}

class RegenerateTokenButton extends ApiCallButton {
    constructor() {
        super('Regenerate Token', '/img/logout.svg', 'Logs you out of all Devices', '/api/auth/regenerate-token', (res: Response): void => {
            location.href = '/login';
        });
    }
}

class SessionDurationInput extends Input<number> {
    constructor() {
        super('sessionDuration', 'number', 'Session Duration:', 'You can change your Session Duration (Days)');
        this.input.classList.add('small');
    }

    async parse(): Promise<number | undefined> {
        const sessionDuration: number = parseInt(this.input.value);
        if(sessionDuration == this.precompiledValue) {
            this.precompile(sessionDuration);
            return sessionDuration;
        }
        if(!Number.isSafeInteger(sessionDuration)) {
            this.setError(true, 'Invalid Verification Code!');
            return undefined;
        }
        if(sessionDuration < 5 || sessionDuration > 90) {
            this.setError(true, 'Session Duration must be between 5 and 90 Days!');
            return undefined;
        }
        this.setError(false, 'Valid Session Duration');
        return sessionDuration;
    }
}

class TfaActivationInput extends InputElement<number> {
    private formOrSection: Form | InputSection | undefined = undefined;
    private readonly box: HTMLDivElement;
    private readonly qr: HTMLImageElement;
    private readonly labelText: string;
    private readonly codeInput: HTMLInputElement;
    private readonly feedback: HTMLSpanElement;
    private timeout: NodeJS.Timeout | undefined = undefined;
    private key: string | undefined = undefined;
    private error: boolean = true;

    constructor() {
        super('tfa-activation');
        this.box = document.createElement('div');
        this.box.classList.add('box', 'margin-top');
        this.qr = document.createElement('img');
        this.qr.classList.add('rounded');
        this.qr.alt = '2FA QR';
        this.labelText = '2FA Code Test:';
        this.codeInput = document.createElement('input');
        this.codeInput.id = this.id;
        this.codeInput.classList.add('medium');
        this.codeInput.type = 'number';
        this.feedback = document.createElement('span');
        this.feedback.classList.add('text', 'error');
        this.feedback.innerText = 'Input 2FA Code!';
        this.codeInput.addEventListener('keyup', (): void => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout((): void => {
                this.parse();
            }, 1000);
        });
        this.codeInput.addEventListener('keydown', (): void => {
            clearTimeout(this.timeout);
        });
        this.codeInput.addEventListener('focusout', (): void => {
            clearTimeout(this.timeout);
            this.parse();
        });
        this.codeInput.addEventListener('change', (): void => {
            this.parse();
        });
        this.show(false);
    }

    appendTo(formOrSection: Form | InputSection): void {
        this.formOrSection = formOrSection;
        const container = document.createElement('div');
        container.classList.add('container', 'label-input');
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.innerText = this.labelText;
        container.appendChild(label);
        container.appendChild(this.codeInput);
        this.box.appendChild(this.qr);
        this.box.appendChild(container);
        this.box.appendChild(this.feedback);
        formOrSection.appendChild(this.box);
    }

    async parse(): Promise<number | undefined> {
        const text = this.codeInput.value.replace(' ', '');
        const code: number = parseInt(this.codeInput.value);
        if(!Number.isSafeInteger(code)) {
            this.setError(true, 'Invalid 2FA Code!');
            return undefined;
        }
        if(text.length != 6) {
            this.setError(true, '6 Digits needed!');
            return undefined;
        }
        return new Promise((resolve: (value: number | undefined) => void): void => {
            $.ajax({
                url: '/api/auth/tfa/validate-code',
                method: 'GET',
                data: {
                    tfaKey: this.key,
                    tfaCode: code
                },
                contentType: 'application/json',
                success: (res: Response): void => {
                    if(res.valid) {
                        this.setError(false, 'Verified 2FA Code');
                        resolve(code);
                    }
                    else {
                        this.setError(true, 'Wrong 2FA Code!');
                        resolve(undefined);
                    }
                },
                error: (): void => {
                    this.setError(true, 'Server Unreachable!');
                    resolve(undefined);
                }
            });
        })
    }

    getKey(): string | undefined {
        return this.key;
    }

    setError(error: boolean, feedbackText: string): void {
        this.error = error;
        if(this.error)
            this.feedback.classList.replace('success', 'error');
        else
            this.feedback.classList.replace('error', 'success');
        this.feedback.innerText = feedbackText;
        this.formOrSection?.validate();
    }

    getError(): boolean {
        return this.key != undefined ? this.error : false;
    }

    async show(show: boolean): Promise<void> {
        if(show) {
            this.box.style.display = '';
            return new Promise((resolve: () => void): void => {
                $.ajax({
                    url: '/api/auth/tfa/generate-key',
                    method: 'GET',
                    success: (res: Response): void => {
                        this.qr.src = res.tfaQr;
                        this.key = res.tfaKey;
                        resolve();
                    },
                    statusCode: defaultStatusCode
                });
            });
        }
        else {
            this.box.style.display = 'none';
            this.key = undefined;
        }
    }
}

const passwordInput = new PasswordInput('You can change your Password');
const sessionDurationInput = new SessionDurationInput();
const sessionExpirationInfoSpan = new InfoSpan('Session Expiration:');
const tfaInput = new BooleanInput('tfa', '2 Factor Authentication', 'Protects your Account', async (value: boolean): Promise<void> => {
    await tfaActivationInput.show(value);
    settingsForm.validate();
});
const tfaActivationInput = new TfaActivationInput();

class SecuritySection extends InputSection {
    constructor() {
        super('Security', [
            passwordInput,
            new LogoutButton(),
            sessionExpirationInfoSpan,
            new RegenerateTokenButton(),
            sessionDurationInput,
            tfaInput,
            tfaActivationInput
        ]);
        this.section.classList.add('warning');
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            password: await passwordInput.parse()
        };
    }
}

const cssManager = new CssManager();
async function previewCustomization(): Promise<void> {
    const cssSettings = new CssSettings({
        compactMode: await compactModeInput.parse(),
        condensedFont: await condensedFontInput.parse(),
        aurebeshFont: await aurebeshFontInput.parse(),
        sharpMode: await sharpModeInput.parse()
    });
    cssManager.applyStyle(cssSettings);
}

const compactModeInput = new BooleanInput('compact-mode', 'Compact Mode', 'Enables a View with smaller Spaces', previewCustomization);
const condensedFontInput = new BooleanInput('condensed-font', 'Condensed Font', 'Enables a narrower Font', previewCustomization);
const aurebeshFontInput = new BooleanInput('aurebesh-font', 'Aurebesh Font', 'Enables the Star Wars Font', previewCustomization);
const sharpModeInput = new BooleanInput('sharp-mode', 'Sharp Mode', 'Enables sharper Borders', previewCustomization);

class CustomizationSection extends InputSection {
    constructor() {
        super('Customization', [compactModeInput, condensedFontInput, aurebeshFontInput, sharpModeInput]);
    }

    async parse(): Promise<{ [index: string]: boolean; }> {
        return {
            compactMode: await compactModeInput.parse(),
            condensedFont: await condensedFontInput.parse(),
            aurebeshFont: await aurebeshFontInput.parse(),
            sharpMode: await sharpModeInput.parse()
        };
    }
}

class SettingsForm extends StructuredForm {
    constructor() {
        super('settings-form', '', '', [
            pfpInput,
            new InfoSection(),
            new SecuritySection(),
            new CustomizationSection()
        ], new ContinueButton(), (): void => {}, [], 'settings', '/api/settings');
    }

    precompile(res: Response): void {
        pfpInput.precompile(res.pfp);
        idInfoSpan.set(res.id);
        usernameInput.precompile(res.username);
        emailInput.precompile(res.email);
        statusInput.precompile(res.status);
        passwordInput.precompile('');
        sessionDurationInput.precompile(res.sessionDuration);
        sessionExpirationInfoSpan.set(new Date(res.sessionExpiration * 1000).toLocaleString('en-ZA'));
        tfaInput.precompile(res.tfa);
        compactModeInput.set(res.customization.compactMode);
        condensedFontInput.set(res.customization.condensedFont);
        aurebeshFontInput.set(res.customization.aurebeshFont);
        sharpModeInput.set(res.customization.sharpMode);
    }

    async submit(): Promise<void> {
        this.show(false);
        oldPasswordForm.show(true);
    }

    async getData(): Promise<{ [index: string]: any; }> {
        const data: { [index: string]: any; } = {
            username: await usernameInput.parse(),
            email: await emailInput.parse(),
            status: await statusInput.parse(),
            customization: {
                compactMode: await compactModeInput.parse(),
                condensedFont: await condensedFontInput.parse(),
                aurebeshFont: await aurebeshFontInput.parse(),
                sharpMode: await sharpModeInput.parse()
            },
            sessionDuration: await sessionDurationInput.parse()
        };
        if(pfpInput.changed()) {
            const pfp = await pfpInput.parse();
            if(pfp != undefined)
                data.pfp = pfp;
        }
        if(passwordInput.changed()) {
            const password = await passwordInput.parse();
            if(password != undefined)
                data.password = password;
        }
        if(tfaInput.changed()) {
            if(await tfaInput.parse() && tfaActivationInput.getKey() != undefined)
                data.tfaKey = tfaActivationInput.getKey();
            else
                data.tfaKey = null;
        }
        return data;
    }
}

const settingsForm = new SettingsForm();

class SaveButton extends Button {
    constructor() {
        super('Save', '/img/save.svg', true);
    }
}

const oldPasswordInput = new PasswordInput();

const settingsStatusCode = Object.assign({}, defaultStatusCode);
settingsStatusCode[403] = (): void => {
    oldPasswordInput.setError(true, 'Wrong Password!');
};

class OldPasswordForm extends StructuredForm {
    constructor() {
        super('old-password-form', '/api/settings', 'PATCH', [
            oldPasswordInput
        ], new SaveButton(), (res: Response): void => {
            window.location.href = '/';
        }, settingsStatusCode, 'authentication');
    }

    async getData(): Promise<string> {
        return JSON.stringify({
            ...(await settingsForm.getData() as object),
            oldPassword: await oldPasswordInput.parse()
        });
    }
}

const oldPasswordForm = new OldPasswordForm();
oldPasswordForm.show(false);
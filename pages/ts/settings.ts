import { ApiCallButton, ApiFeedbackInput, BooleanInput, Button, Form, ImageInput, InfoSpan, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { Response, defaultStatusCode } from "./utils.js";

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
        const parsed: number = parseInt(this.input.value);
        if(parsed == this.precompiledValue) {
            this.precompile(parsed);
            return parsed;
        }
        if(!Number.isSafeInteger(parsed)) {
            this.setError(true, 'Invalid Verification Code!');
            return undefined;
        }
        if(parsed < 5 || parsed > 90) {
            this.setError(true, 'Sessio Duration must be between 5 and 90 Days!');
            return undefined;
        }
        this.setError(false, 'Valid Session Duration');
        return parsed;
    }
}

const passwordInput = new PasswordInput('You can change your Password');
const sessionDurationInput = new SessionDurationInput();
const sessionExpirationInfoSpan = new InfoSpan('Session Expiration:');
const tfaInput = new BooleanInput('tfa', '2 Factor Authentication', 'Protects your Account');

class SecuritySection extends InputSection {
    constructor() {
        super('Security', [
            passwordInput,
            new LogoutButton(),
            sessionExpirationInfoSpan,
            new RegenerateTokenButton(),
            sessionDurationInput,
            tfaInput
        ]);
        this.section.classList.add('warning');
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            password: await passwordInput.parse()
        };
    }
}

const compactModeInput = new BooleanInput('compact-mode', 'Compact Mode', 'Enables a View with smaller Spaces');
const condensedFontInput = new BooleanInput('condensed-font', 'Condensed Font', 'Enables a narrower Font');
const aurebeshFontInput = new BooleanInput('aurebesh-font', 'Aurebesh Font', 'Enables the Star Wars Font');
const sharpModeInput = new BooleanInput('sharp-mode', 'Sharp Mode', 'Enables sharper Borders');

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
        tfaInput.set(res.tfa);
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
            }
        };
        const pfp = await pfpInput.parse();
        if(pfp != undefined && pfpInput.changed())
            data.pfp = pfp;
        const password = await passwordInput.parse();
        if(password != undefined && passwordInput.changed())
            data.password = password;
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

class OldPasswordForm extends StructuredForm {
    constructor() {
        super('old-password-form', '/api/settings', 'PATCH', [
            oldPasswordInput
        ], new SaveButton(), (res: Response): void => {
            window.location.href = '/';
        }, settingsStatusCode, 'authentication');
    }

    async getData(): Promise<string | { [index: string]: any; }> {
        return {
            ...(await settingsForm.getData() as object),
            oldPassword: await oldPasswordInput.parse()
        };
    }
}

const oldPasswordForm = new OldPasswordForm();
oldPasswordForm.show(false);
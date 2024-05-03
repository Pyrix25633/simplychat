import { ApiCallButton, BooleanInput, Button, Form, ImageInput, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
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

class StatusInput extends Input<string> {
    constructor() {
        super('status', 'text', 'Status:', 'Input Status');
    }

    async parse(): Promise<string | undefined> {
        const status = this.getInputValue();
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

    set(value: string): void {
        this.setInputValue(value);
    }
}

const pfpInput = new PfpInput();

const statusInput = new StatusInput();

class InfoSection extends InputSection {
    constructor() {
        super('Info', [statusInput]);
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

const passwordInput = new PasswordInput();
const tfaInput = new BooleanInput('tfa', '2 Factor Authentication', 'Protects your Account');

class SecuritySection extends InputSection {
    constructor() {
        super('Security', [passwordInput, new LogoutButton(), new RegenerateTokenButton(), tfaInput]);
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
        pfpInput.set(res.pfp);
        statusInput.set(res.status);
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

    async getData(): Promise<string | { [index: string]: any; }> {
        return {
            status: await statusInput.parse()
        }
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
import { Button, Form, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { Response, defaultStatusCode } from "./utils.js";

await loadSettings();

class ContinueButton extends Button {
    constructor() {
        super('Continue', '/img/continue.svg', true);
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

const statusInput = new StatusInput();

class InfoSection extends InputSection {
    constructor() {
        super('Info', [statusInput]);
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            status: statusInput.parse()
        };
    }
}

class SettingsForm extends StructuredForm {
    constructor() {
        super('settings-form', '', '', [
            new InfoSection()
        ], new ContinueButton(), (): void => {}, [], '/api/settings');
    }

    precompile(res: Response): void {
        statusInput.set(res.status);
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
        }, settingsStatusCode);
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
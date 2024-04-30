import { Button, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { defaultStatusCode } from "./utils.js";
await loadSettings();
class ContinueButton extends Button {
    constructor() {
        super('Continue', '/img/continue.svg', true);
    }
}
class StatusInput extends Input {
    constructor() {
        super('status', 'text', 'Status:', 'Input Status');
    }
    async parse() {
        const status = this.getInputValue();
        if (status.length < 3) {
            this.setError(true, 'Status too short!');
            return undefined;
        }
        if (status.length > 64) {
            this.setError(true, 'Status too long!');
            return undefined;
        }
        this.setError(false, 'Valid Status');
        return status;
    }
    set(value) {
        this.setInputValue(value);
    }
}
const statusInput = new StatusInput();
class InfoSection extends InputSection {
    constructor() {
        super('Info', [statusInput]);
    }
    async parse() {
        return {
            status: statusInput.parse()
        };
    }
}
class SettingsForm extends StructuredForm {
    constructor() {
        super('settings-form', '', '', [
            new InfoSection()
        ], new ContinueButton(), () => { }, [], '/api/settings');
    }
    precompile(res) {
        statusInput.set(res.status);
    }
    async submit() {
        this.show(false);
        oldPasswordForm.show(true);
    }
    async getData() {
        return {
            status: await statusInput.parse()
        };
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
        ], new SaveButton(), (res) => {
            window.location.href = '/';
        }, settingsStatusCode);
    }
    async getData() {
        return Object.assign(Object.assign({}, await settingsForm.getData()), { oldPassword: await oldPasswordInput.parse() });
    }
}
const oldPasswordForm = new OldPasswordForm();
oldPasswordForm.show(false);

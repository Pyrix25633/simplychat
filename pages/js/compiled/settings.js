import { BooleanInput, Button, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
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
const compactModeInput = new BooleanInput('compact-mode', 'Compact Mode', 'Enables a View with smaller Spaces');
const condensedFontInput = new BooleanInput('condensed-font', 'Condensed Font', 'Enables a narrower Font');
const aurebeshFontInput = new BooleanInput('aurebesh-font', 'Aurebesh Font', 'Enables the Star Wars Font');
const sharpModeInput = new BooleanInput('sharp-mode', 'Sharp Mode', 'Enables sharper Borders');
class CustomizationSection extends InputSection {
    constructor() {
        super('Customization', [compactModeInput, condensedFontInput, aurebeshFontInput, sharpModeInput]);
    }
    async parse() {
        return {};
    }
}
class SettingsForm extends StructuredForm {
    constructor() {
        super('settings-form', '', '', [
            new InfoSection(),
            new CustomizationSection()
        ], new ContinueButton(), () => { }, [], 'settings', '/api/settings');
    }
    precompile(res) {
        statusInput.set(res.status);
        compactModeInput.set(res.settings.compactMode);
        condensedFontInput.set(res.settings.condensedFont);
        aurebeshFontInput.set(res.settings.aurebeshFont);
        sharpModeInput.set(res.settings.sharpMode);
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
        }, settingsStatusCode, 'authentication');
    }
    async getData() {
        return Object.assign(Object.assign({}, await settingsForm.getData()), { oldPassword: await oldPasswordInput.parse() });
    }
}
const oldPasswordForm = new OldPasswordForm();
oldPasswordForm.show(false);

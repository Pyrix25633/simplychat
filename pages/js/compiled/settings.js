import { ApiCallButton, ApiFeedbackInput, BooleanInput, Button, ImageInput, InfoSpan, Input, InputSection, PasswordInput, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { defaultStatusCode } from "./utils.js";
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
class StatusInput extends Input {
    constructor() {
        super('status', 'text', 'Status:', 'You can change your Status');
    }
    async parse() {
        const status = this.getInputValue();
        if (status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
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
}
const idInfoSpan = new InfoSpan('Id:');
const usernameInput = new UsernameInput();
const emailInput = new EmailInput();
const statusInput = new StatusInput();
class InfoSection extends InputSection {
    constructor() {
        super('Info', [idInfoSpan, usernameInput, emailInput, statusInput]);
    }
    async parse() {
        return {
            status: await statusInput.parse()
        };
    }
}
class LogoutButton extends ApiCallButton {
    constructor() {
        super('Logout', '/img/logout.svg', 'Logs you out of this Device', '/api/auth/logout', (res) => {
            location.href = '/login';
        });
    }
}
class RegenerateTokenButton extends ApiCallButton {
    constructor() {
        super('Regenerate Token', '/img/logout.svg', 'Logs you out of all Devices', '/api/auth/regenerate-token', (res) => {
            location.href = '/login';
        });
    }
}
const passwordInput = new PasswordInput('You can change your Password');
const sessionExpirationInfoSpan = new InfoSpan('Session Expiration:');
const tfaInput = new BooleanInput('tfa', '2 Factor Authentication', 'Protects your Account');
class SecuritySection extends InputSection {
    constructor() {
        super('Security', [passwordInput, new LogoutButton(), sessionExpirationInfoSpan, new RegenerateTokenButton(), tfaInput]);
        this.section.classList.add('warning');
    }
    async parse() {
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
    async parse() {
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
        ], new ContinueButton(), () => { }, [], 'settings', '/api/settings');
    }
    precompile(res) {
        pfpInput.precompile(res.pfp);
        idInfoSpan.set(res.id);
        usernameInput.precompile(res.username);
        emailInput.precompile(res.email);
        statusInput.precompile(res.status);
        passwordInput.precompile('');
        sessionExpirationInfoSpan.set(new Date(res.sessionExpiration * 1000).toLocaleString('en-ZA'));
        tfaInput.set(res.tfa);
        compactModeInput.set(res.customization.compactMode);
        condensedFontInput.set(res.customization.condensedFont);
        aurebeshFontInput.set(res.customization.aurebeshFont);
        sharpModeInput.set(res.customization.sharpMode);
    }
    async submit() {
        this.show(false);
        oldPasswordForm.show(true);
    }
    async getData() {
        const data = {
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
        if (pfp != undefined && pfpInput.changed())
            data.pfp = pfp;
        const password = await passwordInput.parse();
        if (password != undefined && passwordInput.changed())
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

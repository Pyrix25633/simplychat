import { Button, Form, StructuredForm } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { Response } from "./utils.js";

await loadSettings();

class ContinueButton extends Button {
    constructor() {
        super('Continue', '/img/continue.svg', true);
    }
}

const continueButton = new ContinueButton();

class SettingsForm extends StructuredForm {
    constructor() {
        super('settings-form', '/api/settings', 'PATCH', [

        ], continueButton, (): void => {}, [], '/api/settings');
    }

    precompile(res: Response): void {
        
    }

    async submit(): Promise<void> {
        
    }
}

class SaveButton extends Button {
    constructor() {
        super('Save', '/img/save.svg', true);
    }
}
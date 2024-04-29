import { Form } from "./form.js";
import { loadSettings } from "./load-settings.js";

await loadSettings();

class SettingsForm extends Form {
    constructor() {
        super('settings-form', '/api/settings', 'PATCH', [

        ], ); //TODO
    }
}
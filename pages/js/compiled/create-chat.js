import { Button, Form, Input } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { defaultStatusCode } from "./utils.js";
await loadSettings();
class NameInput extends Input {
    constructor() {
        super('name', 'text', 'Name:', 'Input Chat Name');
    }
    async parse() {
        const status = this.getInputValue();
        if (status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
        if (status.length < 3) {
            this.setError(true, 'Chat Name too short!');
            return undefined;
        }
        if (status.length > 64) {
            this.setError(true, 'Chat Name too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Name');
        return status;
    }
}
class DescriptionInput extends Input {
    constructor() {
        super('description', 'text', 'Description:', 'Input Chat Description');
    }
    async parse() {
        const status = this.getInputValue();
        if (status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
        if (status.length < 3) {
            this.setError(true, 'Chat Description too short!');
            return undefined;
        }
        if (status.length > 128) {
            this.setError(true, 'Chat Description too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Description');
        return status;
    }
}
const nameInput = new NameInput();
const descriptionInput = new DescriptionInput();
class CreateChatForm extends Form {
    constructor() {
        super('create-chat-form', '/api/chats', 'POST', [
            nameInput,
            descriptionInput
        ], new Button('Create', '/img/confirm.svg'), (res) => {
            window.location.href = '/';
        }, defaultStatusCode);
    }
}
const createChatForm = new CreateChatForm();

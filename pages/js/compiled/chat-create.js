import { DescriptionInput, NameInput } from "./chat-inputs.js";
import { Button, Form } from "./form.js";
import { loadCustomization } from "./load-customization.js";
import { defaultStatusCode } from "./utils.js";
await loadCustomization();
const nameInput = new NameInput();
const descriptionInput = new DescriptionInput();
class CreateChatForm extends Form {
    constructor() {
        super('chat-create-form', '/api/chats', 'POST', [
            nameInput,
            descriptionInput
        ], new Button('Create', '/img/confirm.svg'), (res) => {
            window.location.href = '/';
        }, defaultStatusCode);
    }
}
const createChatForm = new CreateChatForm();

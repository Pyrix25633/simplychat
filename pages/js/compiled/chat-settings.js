import { DescriptionInput, NameInput } from "./chat-inputs.js";
import { ActionButton, ApiCallButton, Button, ImageInput, InfoSpan, Input, InputSection, StructuredForm } from "./form.js";
import { loadCustomization } from "./load-customization.js";
import { defaultStatusCode } from "./utils.js";
await loadCustomization();
const chatIdMatch = window.location.href.match(/^.+\/chats\/(\d+)\/settings.*$/);
if (chatIdMatch == null) {
    window.location.href = '/error?code=400&message=Bad%20Request';
    throw new Error('Invalid chatId!');
}
const chatId = chatIdMatch[1];
const logoInput = new ImageInput('logo', 'Logo', 'You can change the Chat\'s Logo');
const idInfoSpan = new InfoSpan('Id:');
const nameInput = new NameInput();
const descriptionInput = new DescriptionInput();
class InfoSection extends InputSection {
    constructor() {
        super('Info', [
            nameInput,
            descriptionInput
        ]);
    }
    async parse() {
        return {
            name: await nameInput.parse(),
            description: await descriptionInput.parse()
        };
    }
}
class TokenExpirationInput extends Input {
    constructor() {
        super('tokenExpiration', 'text', 'Token Expiration:', 'You can change the Chat\'s Token Expiration ("Never" or YYYY/MM/DD)');
    }
    async parse() {
        const tokenExpiration = this.input.value;
        if (tokenExpiration == this.precompiledValue) {
            this.precompile(tokenExpiration);
            return tokenExpiration;
        }
        const tokenExpirationMatch = tokenExpiration.match(/\d{4}\/\d{1,2}\/\d{1,2}/);
        const tokenExpirationDate = new Date(tokenExpiration);
        if (tokenExpirationMatch == null || tokenExpirationDate.toString() == 'Invalid Date' || isNaN(tokenExpirationDate.getTime())) {
            this.setError(true, 'Invalid Token Expiration!');
            return undefined;
        }
        this.setError(false, 'Valid Token Expiration');
        return tokenExpiration;
    }
    precompile(value) {
        if (value == null)
            value = 'Never';
        super.precompile(value);
    }
}
const chatToken = {
    token: ''
};
const copyInviteLinkButton = new ActionButton('Copy Invite Link', '/img/link.svg', 'Any User can join this Chat with this Link', () => {
    navigator.clipboard.writeText('https://' + window.location.host + '/chats/' + chatId + '/join?token=' + chatToken.token);
});
const regenerateTokenButton = new ApiCallButton('Regenerate Token', '/img/change.svg', 'Previous Invite Link will no longer work', '/api/chats/' + chatId + '/regenerate-token', (res) => {
    chatToken.token = res.token;
});
const tokenExpirationInput = new TokenExpirationInput();
class SecuritySection extends InputSection {
    constructor() {
        super('Security', [
            copyInviteLinkButton,
            regenerateTokenButton,
            tokenExpirationInput
        ]);
        this.section.classList.add('warning');
    }
    async parse() {
        return {
            tokenExpiration: await tokenExpirationInput.parse()
        };
    }
}
class ChatSettingsForm extends StructuredForm {
    constructor() {
        super('chat-settings-form', '/api/chats/{chatId}/settings', 'PATCH', [
            logoInput,
            new InfoSection(),
            new SecuritySection()
        ], new Button('Save', '/img/save.svg', true), (res) => {
            window.location.href = '/';
        }, defaultStatusCode, undefined, true);
    }
    async getUrl() {
        return this.url.replace('{chatId}', chatId);
    }
    precompile(res) {
        logoInput.precompile(res.logo);
        idInfoSpan.set(chatId);
        nameInput.precompile(res.name);
        descriptionInput.precompile(res.description);
        chatToken.token = res.token;
        tokenExpirationInput.precompile(res.tokenExpiration);
    }
    async getData() {
        return JSON.stringify({
            name: await nameInput.parse(),
            description: await descriptionInput.parse(),
            tokenExpiration: await tokenExpirationInput.parse()
        });
    }
}
const chatSettingsForm = new ChatSettingsForm();

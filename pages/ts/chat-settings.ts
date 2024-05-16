import { DescriptionInput, NameInput } from "./chat-inputs.js";
import { ActionButton, ApiCallButton, Button, Form, ImageInput, InfoSpan, Input, InputElement, InputSection, StructuredForm } from "./form.js";
import { loadCustomization } from "./load-customization.js";
import { Response, defaultStatusCode, imageButtonAnimationKeyframes, imageButtonAnimationOptions } from "./utils.js";

await loadCustomization();

const chatIdMatch = window.location.href.match(/^.+\/chats\/(\d+)\/settings.*$/);
if(chatIdMatch == null) {
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

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            name: await nameInput.parse(),
            description: await descriptionInput.parse()
        };
    }
}

class TokenExpirationInput extends Input<string | null> {
    constructor() {
        super('tokenExpiration', 'text', 'Token Expiration:', 'You can change the Chat\'s Token Expiration ("Never" or YYYY/MM/DD)');
    }

    async parse(): Promise<string | null | undefined> {
        const tokenExpiration: string = this.input.value;
        if(tokenExpiration == this.precompiledValue) {
            this.precompile(tokenExpiration);
            return tokenExpiration != 'Never' ? tokenExpiration : null;
        }
        if(tokenExpiration == 'Never') {
            this.setError(false, 'Valid Token Expiration');
            return null;
        }
        const tokenExpirationMatch = tokenExpiration.match(/\d{4}\/\d{1,2}\/\d{1,2}/);
        const tokenExpirationDate = new Date(tokenExpiration);
        if(tokenExpirationMatch == null || tokenExpirationDate.toString() == 'Invalid Date' || isNaN(tokenExpirationDate.getTime())) {
            this.setError(true, 'Invalid Token Expiration!');
            return undefined;
        }
        this.setError(false, 'Valid Token Expiration');
        return tokenExpiration;
    }

    precompile(value: string | null): void {
        if(value == null)
            value = 'Never';
        super.precompile(value);
    }
}

const PermissionLevels = ["ADMINISTRATOR", "MODERATOR", "USER", "VIEWER"];
type PermissionLevel = typeof PermissionLevels[number];

namespace PermissionLevel {
    export function increase(permissionLevel: PermissionLevel | undefined): PermissionLevel {
        switch(permissionLevel) {
            case "MODERATOR": return "ADMINISTRATOR";
            case "USER": return "MODERATOR";
            case "VIEWER": return "USER";
            default: return "ADMINISTRATOR";
        }
    }

    export function decrease(permissionLevel: PermissionLevel | undefined): PermissionLevel {
        switch(permissionLevel) {
            case "ADMINISTRATOR": return "MODERATOR";
            case "MODERATOR": return "USER";
            case "USER": return "VIEWER";
            default: return "VIEWER";
        }
    }
}

class DefaultPermissionLevelInput extends InputElement<PermissionLevel> {
    private readonly span: HTMLSpanElement;
    private readonly increase: HTMLImageElement;
    private readonly decrease: HTMLImageElement;
    private defaultPermissionLevel: PermissionLevel | undefined = undefined;

    constructor() {
        super('default-permission-level');
        this.span = document.createElement('span');
        this.span.classList.add('permission-level');
        this.increase = document.createElement('img');
        this.increase.classList.add('button');
        this.increase.alt = 'Increase Default Permission Level';
        this.increase.src = '/img/increase.svg';
        this.increase.addEventListener('click', (): void => {
            this.increase.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.set(PermissionLevel.increase(this.defaultPermissionLevel));
        });
        this.decrease = document.createElement('img');
        this.decrease.classList.add('button');
        this.decrease.alt = 'Decrease Default Permission Level';
        this.decrease.src = '/img/decrease.svg';
        this.decrease.addEventListener('click', (): void => {
            this.decrease.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.set(PermissionLevel.decrease(this.defaultPermissionLevel));
        });
        this.set("USER");
    }

    appendTo(formOrSection: Form | InputSection): void {
        const box = document.createElement('div');
        box.classList.add('box', 'input-feedback');
        const container = document.createElement('div');
        container.classList.add('container', 'default-permission-level');
        const increseDecrease = document.createElement('div');
        increseDecrease.classList.add('container', 'increase-decrease');
        increseDecrease.appendChild(this.increase);
        increseDecrease.appendChild(this.decrease);
        container.appendChild(this.span);
        container.appendChild(increseDecrease);
        const feedback = document.createElement('span');
        feedback.classList.add('text');
        feedback.innerText = 'Defaul Permission Level';
        box.appendChild(container);
        box.appendChild(feedback);
        formOrSection.appendChild(box);
    }

    async parse(): Promise<PermissionLevel | undefined> {
        return this.defaultPermissionLevel;
    }

    getError(): boolean {
        return false;
    }

    set(value: PermissionLevel): void {
        this.defaultPermissionLevel = value;
        this.span.innerText = this.defaultPermissionLevel[0] + this.defaultPermissionLevel.substring(1).toLowerCase();
        for(const permissionLevel of PermissionLevels)
            this.span.classList.remove('permission-level-' + permissionLevel.toLowerCase())
        this.span.classList.add('permission-level-' + this.defaultPermissionLevel.toLowerCase());
        this.increase.style.display = value == "ADMINISTRATOR" ? 'none' : '';
        this.decrease.style.display = value == "VIEWER" ? 'none' : '';
    }
}

type UserPermissionLevel = {
    userId: number;
    permissionLevel: PermissionLevel;
}
type UsersInputResult = {
    modifiedUsers: UserPermissionLevel[];
    removedUsers: number[];
};

class UsersInput extends InputElement<UsersInputResult> {
    private readonly users: HTMLDivElement;
    private readonly noUsersPlaceholder: HTMLDivElement;
    private modifiedUsers: Map<number, PermissionLevel>;
    private removedUsers: number[];

    constructor() {
        super('users');
        this.users = document.createElement('div');
        this.users.id = this.id;
        this.users.classList.add('box');
        this.noUsersPlaceholder = document.createElement('div');
        this.noUsersPlaceholder.classList.add('container', 'user');
        this.modifiedUsers = new Map();
        this.removedUsers = [];
    }

    appendTo(formOrSection: Form | InputSection): void {
        const pfp = document.createElement('img');
        pfp.classList.add('pfp');
        pfp.alt = 'Unknown';
        pfp.src = '/img/unknown.svg';
        const username = document.createElement('span');
        username.classList.add('username');
        username.innerText = 'No Users';
        this.noUsersPlaceholder.appendChild(pfp);
        this.noUsersPlaceholder.appendChild(username);
        this.users.appendChild(this.noUsersPlaceholder);
        formOrSection.appendChild(this.users);
    }

    showNoUsersPlaceholder(): void {
        this.noUsersPlaceholder.style.display = this.users.childNodes.length > 0 ? 'none' : '';
    }

    async parse(): Promise<UsersInputResult> {
        const modifiedUsersArray: UserPermissionLevel[] = [];
        for(const modifiedUser of this.modifiedUsers)
            modifiedUsersArray.push({ userId: modifiedUser[0], permissionLevel: modifiedUser[1] });
        return {
            modifiedUsers: modifiedUsersArray,
            removedUsers: this.removedUsers
        };
    }

    add(value: UserPermissionLevel): void {
        const container = document.createElement('div');
        container.classList.add('container', 'user');
        const pfpUsername = document.createElement('div');
        pfpUsername.classList.add('container');
        const pfp = document.createElement('img');
        pfp.alt = 'Profile Picture';
        pfp.classList.add('pfp');
        const username = document.createElement('span');
        username.classList.add('username');
        const removeIncreaseDecrease = document.createElement('div');
        removeIncreaseDecrease.classList.add('container', 'remove-increase-decrease');
        const remove = document.createElement('img');
        remove.classList.add('button');
        remove.alt = 'Remove User';
        remove.src = '/img/remove.svg';
        remove.addEventListener('click', (): void => {
            remove.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.modifiedUsers.delete(value.userId);
            if(!this.removedUsers.includes(value.userId))
                this.removedUsers.push(value.userId);
            this.users.removeChild(container);
            this.showNoUsersPlaceholder();
        });
        const modifiedUsers = this.modifiedUsers;
        function setPermissionLevel(permissionLevel: PermissionLevel): void {
            value.permissionLevel = permissionLevel;
            modifiedUsers.set(value.userId, permissionLevel);
            for(const pl of PermissionLevels)
                username.classList.remove('permission-level-' + pl.toLowerCase());
            username.classList.add('permission-level-' + permissionLevel.toLowerCase());
            increase.style.display = permissionLevel == "ADMINISTRATOR" ? 'none' : '';
            decrease.style.display = permissionLevel == "VIEWER" ? 'none' : '';
        }
        const increase = document.createElement('img');
        increase.classList.add('button');
        increase.alt = 'Increase User\'s Permission Level';
        increase.src = '/img/increase.svg';
        increase.addEventListener('click', (): void => {
            increase.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            setPermissionLevel(PermissionLevel.increase(value.permissionLevel));
        });
        const decrease = document.createElement('img');
        decrease.classList.add('button');
        decrease.alt = 'Decrease User\'s Permission Level';
        decrease.src = '/img/decrease.svg';
        decrease.addEventListener('click', (): void => {
            decrease.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            setPermissionLevel(PermissionLevel.decrease(value.permissionLevel));
        });
        pfpUsername.appendChild(pfp);
        pfpUsername.appendChild(username);
        removeIncreaseDecrease.appendChild(remove);
        removeIncreaseDecrease.appendChild(increase);
        removeIncreaseDecrease.appendChild(decrease);
        container.appendChild(pfpUsername);
        container.appendChild(removeIncreaseDecrease);
        this.users.appendChild(container);
        setPermissionLevel(value.permissionLevel);
        $.ajax({
            url: '/api/users/' + value.userId,
            method: 'GET',
            success: (res: Response): void => {
                pfp.src = res.pfp;
                username.innerText = res.username;
            },
            statusCode: defaultStatusCode
        });
        this.showNoUsersPlaceholder();
    }

    getError(): boolean {
        return false;
    }
}

const chatToken = {
    token: ''
};
const copyInviteLinkButton = new ActionButton('Copy Invite Link', '/img/link.svg', 'Any User can join this Chat with this Link', (): void => {
    navigator.clipboard.writeText('https://' + window.location.host + '/chats/' + chatId + '/join?token=' + chatToken.token);
});
const regenerateTokenButton = new ApiCallButton('Regenerate Token', '/img/change.svg', 'Previous Invite Link will no longer work', '/api/chats/' + chatId + '/regenerate-token', (res: Response): void => {
    chatToken.token = res.token;
});
const tokenExpirationInput = new TokenExpirationInput();
const defaultPermissionLevelInput = new DefaultPermissionLevelInput();

class SecuritySection extends InputSection {
    constructor() {
        super('Security', [
            copyInviteLinkButton,
            regenerateTokenButton,
            tokenExpirationInput,
            defaultPermissionLevelInput
        ]);
        this.section.classList.add('warning');
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        return {
            tokenExpiration: await tokenExpirationInput.parse()
        };
    }
}

const usersInput = new UsersInput();

class UsersSection extends InputSection {
    constructor() {
        super('Users', [usersInput]);
    }

    async parse(): Promise<{ [index: string]: any; } | undefined> {
        const users = await usersInput.parse();
        return {
            modifiedUsers: users.modifiedUsers,
            removedUsers: users.removedUsers
        };
    }
}

class ChatSettingsForm extends StructuredForm {
    constructor() {
        super('chat-settings-form', '/api/chats/{chatId}/settings', 'PATCH', [
            logoInput,
            new InfoSection(),
            new SecuritySection(),
            new UsersSection()
        ], new Button('Save', '/img/save.svg', true), (res: Response): void => {
            window.location.href = '/';
        }, []/**/, undefined, true);
    }

    async getUrl(): Promise<string> {
        return this.url.replace('{chatId}', chatId);
    }

    precompile(res: Response): void {
        logoInput.precompile(res.logo);
        idInfoSpan.set(chatId);
        nameInput.precompile(res.name);
        descriptionInput.precompile(res.description);
        chatToken.token = res.token;
        tokenExpirationInput.precompile(res.tokenExpiration);
        defaultPermissionLevelInput.set(res.defaultPermissionLevel);
        for(const user of res.users)
            usersInput.add(user);
    }

    async getData(): Promise<string> {
        const users = await usersInput.parse();
        const data: { [index: string]: any; } = {
            name: await nameInput.parse(),
            description: await descriptionInput.parse(),
            tokenExpiration: await tokenExpirationInput.parse(),
            defaultPermissionLevel: await defaultPermissionLevelInput.parse(),
            modifiedUsers: users.modifiedUsers,
            removedUsers: users.removedUsers
        };
        if(logoInput.changed()) {
            const logo = await logoInput.parse();
            if(logo != undefined)
                data.logo = logo;
        }
        return JSON.stringify(data);
    }
}

const chatSettingsForm = new ChatSettingsForm();
import { Button, Form, InputElement, InputSection } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { RequireNonNull, Response, defaultStatusCode } from "./utils.js";

await loadSettings();

const chatIdMatch = window.location.href.match(/^.+\/chats\/(\d+)\/join.*$/);
if(chatIdMatch == null) {
    window.location.href = '/400.html';
    throw new Error('Invalid chatId!');
}
const chatId = chatIdMatch[1];
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if(token == null) {
    window.location.href = '/404.html';
    throw new Error('Invalid token!');
}

abstract class Display extends InputElement<string> {
    async parse(): Promise<string | undefined> {
        throw new Error('Method not implemented!');
    }

    getError(): boolean {
        return false;
    }
}

class DisplayImage extends Display {
    private readonly img: HTMLImageElement;

    constructor(id: string, alt: string) {
        super(id);
        this.img = document.createElement('img');
        this.img.id = id;
        this.img.alt = alt;
    }

    appendTo(formOrSection: Form | InputSection): void {
        formOrSection.appendChild(this.img);
    }

    set(value: string): void {
        this.img.src = value;
    }
}

class DisplayHeading extends Display {
    private readonly heading: HTMLHeadingElement;

    constructor(id: string, dimension: 1 | 2 | 3 | 4 | 5 | 6) {
        super(id);
        this.heading = document.createElement('h' + dimension) as HTMLHeadingElement;
    }

    appendTo(formOrSection: Form | InputSection): void {
        formOrSection.appendChild(this.heading);
    }

    set(value: string): void {
        this.heading.innerText = value;
    }
}

class DisplaySpan extends Display {
    private readonly span: HTMLSpanElement;

    constructor(id: string) {
        super(id);
        this.span = document.createElement('span');
        this.span.classList.add('text');
    }

    appendTo(formOrSection: Form | InputSection): void {
        formOrSection.appendChild(this.span);
    }

    set(value: string): void {
        this.span.innerText = value;
    }
}

const logoDisplay = new DisplayImage('logo', 'Logo');
const nameDisplay = new DisplayHeading('name', 3);
const descriptionDisplay = new DisplaySpan('description');
const usersDisplay = new DisplaySpan('users');

const chatJoinStatusCode = Object.assign({}, defaultStatusCode);
chatJoinStatusCode[403] = (): void => {};

class ChatJoinForm extends Form {
    constructor() {
        super('chat-join-form', '/api/chats/{chatId}/join', 'POST', [
            logoDisplay,
            nameDisplay,
            descriptionDisplay,
            usersDisplay
        ], new Button('Join', '/img/chat-join.svg'), (res: Response): void => {
            window.location.href = '/';
        }, chatJoinStatusCode, 'chat-join');
    }

    async getUrl(): Promise<string> {
        return this.url.replace('{chatId}', chatId);
    }

    async getData(): Promise<string | { [index: string]: any; }> {
        return JSON.stringify({
            token: token
        });
    }
}

const chatJoinForm = new ChatJoinForm();
chatJoinForm.show(false);

$.ajax({
    url: '/api/chats/' + chatId + '/join',
    method: 'GET',
    data: {
        token: token
    },
    success: (res: Response): void => {
        logoDisplay.set(res.logo);
        nameDisplay.set(res.name);
        descriptionDisplay.set(res.description);
        usersDisplay.set(res.users + ' User' + (res.users != 1 ? 's' : ''));
        RequireNonNull.getElementById('error').style.display = 'none';
        chatJoinForm.show(true);
    },
    statusCode: chatJoinStatusCode
});
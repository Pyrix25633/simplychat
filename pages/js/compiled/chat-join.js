import { Button, Form, InputElement } from "./form.js";
import { loadSettings } from "./load-settings.js";
import { RequireNonNull, defaultStatusCode } from "./utils.js";
await loadSettings();
const chatIdMatch = window.location.href.match(/^.+\/chats\/(\d+)\/join.*$/);
if (chatIdMatch == null) {
    window.location.href = '/400.html';
    throw new Error('Invalid chatId!');
}
const chatId = chatIdMatch[1];
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token == null) {
    window.location.href = '/404.html';
    throw new Error('Invalid token!');
}
class Display extends InputElement {
    async parse() {
        throw new Error('Method not implemented!');
    }
    getError() {
        return false;
    }
}
class DisplayImage extends Display {
    constructor(id, alt) {
        super(id);
        this.img = document.createElement('img');
        this.img.id = id;
        this.img.alt = alt;
    }
    appendTo(formOrSection) {
        formOrSection.appendChild(this.img);
    }
    set(value) {
        this.img.src = value;
    }
}
class DisplayHeading extends Display {
    constructor(id, dimension) {
        super(id);
        this.heading = document.createElement('h' + dimension);
    }
    appendTo(formOrSection) {
        formOrSection.appendChild(this.heading);
    }
    set(value) {
        this.heading.innerText = value;
    }
}
class DisplaySpan extends Display {
    constructor(id) {
        super(id);
        this.span = document.createElement('span');
        this.span.classList.add('text');
    }
    appendTo(formOrSection) {
        formOrSection.appendChild(this.span);
    }
    set(value) {
        this.span.innerText = value;
    }
}
const logoDisplay = new DisplayImage('logo', 'Logo');
const nameDisplay = new DisplayHeading('name', 3);
const descriptionDisplay = new DisplaySpan('description');
const usersDisplay = new DisplaySpan('users');
const chatJoinStatusCode = Object.assign({}, defaultStatusCode);
chatJoinStatusCode[403] = () => { };
class ChatJoinForm extends Form {
    constructor() {
        super('chat-join-form', '/api/chats/{chatId}/join', 'POST', [
            logoDisplay,
            nameDisplay,
            descriptionDisplay,
            usersDisplay
        ], new Button('Join', '/img/chat-join.svg'), (res) => {
            window.location.href = '/';
        }, chatJoinStatusCode, 'chat-join');
    }
    async getUrl() {
        return this.url.replace('{chatId}', chatId);
    }
    async getData() {
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
    success: (res) => {
        logoDisplay.set(res.logo);
        nameDisplay.set(res.name);
        descriptionDisplay.set(res.description);
        usersDisplay.set(res.users + ' User' + (res.users != 1 ? 's' : ''));
        RequireNonNull.getElementById('error').style.display = 'none';
        chatJoinForm.show(true);
    },
    statusCode: chatJoinStatusCode
});

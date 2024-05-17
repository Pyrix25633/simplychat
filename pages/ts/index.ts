import { RequireNonNull } from "./utils.js";

class Chat {
    constructor() {

    }

    appendTo(page: Sidebar): void {

    }
}

class Sidebar {
    private readonly sidebar: HTMLDivElement;

    constructor() {
        this.sidebar = document.createElement('div');
    }

    appendChild(node: Node): void {
        this.sidebar.appendChild(node);
    }

    appendTo(page: Page): void {

    }

    expand(expand: boolean) {
        this.sidebar.style.display = expand ? '' : 'flex';
    }
}

class Topbar {
    private readonly chats: Sidebar;
    private readonly expandChats: HTMLImageElement;
    private readonly logo: HTMLImageElement;
    private readonly name: HTMLSpanElement;
    private readonly description: HTMLSpanElement;
    private readonly users: Sidebar;
    private readonly expandUsers: HTMLImageElement;
    private expanded: '' | 'chats' | 'users' = '';

    constructor(chats: Sidebar, users: Sidebar) {
        this.chats = chats;
        this.expandChats = document.createElement('img');
        this.expandChats.classList.add('button');
        this.logo = document.createElement('img');
        this.logo.classList.add('topbar-logo');
        this.name = document.createElement('span');
        this.name.classList.add('topbar-name');
        this.description = document.createElement('span');
        this.description.classList.add('topbar-description');
        this.users = users;
        this.expandUsers = document.createElement('img');
        this.expandUsers.classList.add('button');
    }

    appendTo(page: Page) {

    }

    set(name: string, description: string, logo: string): void {
        this.name.innerText = name;
        this.description.innerText = description;
        this.logo.src = logo;
    }

    expand(sidebar: 'chats' | 'users'): void {
        if(this.expanded == sidebar)
            return;
        if(this.expanded == '') {
            if(sidebar == 'chats') {
                this.expandUsers.src = '/img/collapse.svg';
                this.chats.expand(true);
            }
            else {
                this.expandChats.src = '/img/collapse.svg';
                this.users.expand(true);
            }
            this.expanded = sidebar;
        }
        else {
            if(this.expanded == 'chats') {
                this.expandUsers.src = '/img/expand-left.svg';
                this.chats.expand(false);
            }
            else {
                this.expandChats.src = '/img/expand-right.svg';
                this.users.expand(false);
            }
            this.expanded = '';
        }
    }
}

class Messages {
    constructor() {

    }

    appendTo(page: Page): void {

    }
}

class Page {
    private readonly page: HTMLDivElement;
    private readonly chats: Sidebar;
    private readonly main: HTMLDivElement;
    private readonly topbar: Topbar;
    private readonly messages: Messages;
    private readonly users: Sidebar;

    constructor() {
        this.page = RequireNonNull.getElementById('page') as HTMLDivElement;
        this.chats = new Sidebar();
        this.main = document.createElement('div');
        this.main.classList.add('main');
        this.users = new Sidebar();
        this.topbar = new Topbar(this.chats, this.users);
        this.messages = new Messages();
        this.topbar.appendTo(this);
        this.messages.appendTo(this);
        this.chats.appendTo(this);
        this.page.appendChild(this.main);
        this.users.appendTo(this);
    }

    appendChild(node: Node): void {
        this.page.appendChild(node);
    }

    appendMain(node: Node): void {
        this.main.appendChild(node);
    }
}
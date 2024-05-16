class Chat {
    constructor() {

    }

    appendTo(sidebar: Sidebar): void {

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

    appendTo(main: Main) {

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

class Main {
    private readonly chats: Sidebar;
    private readonly topbar: Topbar;
    private readonly users: Sidebar;

    constructor() {
        this.chats = new Sidebar();
        this.users = new Sidebar();
        this.topbar = new Topbar(this.chats, this.users);
    }

    appendTopbar(node: Node): void {

    }
}
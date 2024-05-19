import { loadCustomization } from "./load-customization.js";
import { PermissionLevel, RequireNonNull, Response, defaultStatusCode } from "./utils.js";

await loadCustomization();

class Chat {
    public readonly id: number;
    private permissionLevel: PermissionLevel;
    private lastMessageId: number;
    private lastReadMessageId: number;
    public readonly box: HTMLDivElement;
    private readonly name: HTMLSpanElement;
    private readonly description: HTMLSpanElement;
    private readonly logo: HTMLImageElement;
    private readonly read: HTMLDivElement;
    private readonly actions: HTMLDivElement;
    private readonly leave: HTMLImageElement;
    private readonly settings: HTMLImageElement;
    private readonly markAsRead: HTMLImageElement;

    constructor(id: number, permissionLevel: PermissionLevel, lastMessageId: number, lastReadMessageId: number) {
        this.id = id;
        this.permissionLevel = permissionLevel;
        this.lastMessageId = lastMessageId;
        this.lastReadMessageId = lastReadMessageId;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat');
        this.box.addEventListener('click', (): void => {
            this.updateSelected(true);
        });
        this.name = document.createElement('span');
        this.name.classList.add('name');
        this.description = document.createElement('span');
        this.description.classList.add('description');
        this.logo = document.createElement('img');
        this.logo.classList.add('logo');
        this.logo.alt = 'Logo';
        this.read = document.createElement('div');
        this.read.classList.add('read');
        this.actions = document.createElement('div');
        this.actions.classList.add('container', 'actions');
        this.leave = document.createElement('img');
        this.leave.classList.add('button');
        this.leave.alt = 'Leave';
        this.leave.src = '/img/leave.svg';
        this.leave.addEventListener('click', (): void => {
            //TODO
        });
        this.settings = document.createElement('img');
        this.settings.classList.add('button');
        this.settings.alt = 'Settings';
        this.settings.src = '/img/settings.svg';
        this.settings.addEventListener('click', (): void => {
            window.location.href = '/chats/' + this.id + '/settings';
        });
        this.markAsRead = document.createElement('img');
        this.markAsRead.classList.add('button');
        this.markAsRead.alt = 'Mark as Read';
        this.markAsRead.src = '/img/mark-as-read.svg';
        this.markAsRead.addEventListener('click', (): void => {
            //TODO
        });
        this.actions.appendChild(this.leave);
        this.actions.appendChild(this.settings);
        this.actions.appendChild(this.markAsRead);
        this.updateSelected(false);
        this.updateRead(lastMessageId, lastReadMessageId);
        $.ajax({
            url: '/api/chats/' + this.id,
            method: 'GET',
            success: (res: Response): void => {
                this.updateSettings(permissionLevel, res.name, res.description, res.logo);
            },
            statusCode: defaultStatusCode
        });
    }

    appendTo(sidebar: Sidebar): void {
        const logoMarquee = document.createElement('div');
        logoMarquee.classList.add('container', 'logo-marquee');
        const logoRead = document.createElement('div');
        logoRead.classList.add('logo');
        logoRead.appendChild(this.logo);
        logoRead.appendChild(this.read);
        const marquee = document.createElement('div');
        marquee.classList.add('box', 'marquee');
        marquee.appendChild(this.name);
        marquee.appendChild(this.description);
        logoMarquee.appendChild(logoRead);
        logoMarquee.appendChild(marquee);
        this.box.appendChild(logoMarquee);
        this.box.appendChild(this.actions);
        sidebar.appendChild(this.box);
    }

    updateSelected(selected: boolean): void {
        if(selected) {
            this.box.classList.add('selected');
            this.actions.style.display = '';
        }
        else {
            this.box.classList.remove('selected');
            this.actions.style.display = 'none';
        }
    }

    updateSettings(permissionLevel: PermissionLevel, name: string, description: string, logo: string): void {
        this.permissionLevel = permissionLevel;
        this.settings.style.display = permissionLevel == 'ADMINISTRATOR' ? 'none' : '';
        this.name.innerText = name;
        this.description.innerText = description;
        this.logo.src = logo;
    }

    updateRead(lastMessageId: number, lastReadMessageId: number): void {
        this.lastMessageId = lastMessageId;
        this.lastReadMessageId = lastReadMessageId;
        if(lastMessageId > lastReadMessageId)
            this.read.classList.replace('unread', 'read');
        else
            this.read.classList.replace('read', 'unread');
    }
}

class User {
    public readonly id: number;
    
    public readonly box: HTMLDivElement;
    

    constructor(id: number) {
        this.id = id;
        
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat');
        this.box.addEventListener('click', (): void => {
            this.updateSelected(true);
        });
        
        $.ajax({
            url: '/api/chats/' + id,
            method: 'GET',
            success: (res: Response): void => {
            },
            statusCode: defaultStatusCode
        });
    }

    appendTo(page: Sidebar): void {
        
    }

    updateSelected(selected: boolean): void {
        
    }

    updateSettings(permissionLevel: PermissionLevel, name: string, description: string, logo: string): void {
        
    }
}

class Sidebar {
    private readonly sidebar: HTMLDivElement;

    constructor() {
        this.sidebar = document.createElement('div');
        this.sidebar.classList.add('box', 'sidebar');
    }

    appendChild(node: Node): void {
        this.sidebar.appendChild(node);
    }

    removeChild(node: Node): void {
        this.sidebar.removeChild(node);
    }

    appendTo(page: Page): void {
        page.appendChild(this.sidebar);
    }

    expand(expand: boolean) {
        this.sidebar.style.display = expand ? '' : 'flex';
    }
}

class Topbar {
    private readonly chatsSidebar: Sidebar;
    private readonly expandChats: HTMLImageElement;
    private readonly logo: HTMLImageElement;
    private readonly name: HTMLSpanElement;
    private readonly description: HTMLSpanElement;
    private readonly usersSidebar: Sidebar;
    private readonly expandUsers: HTMLImageElement;
    private expanded: '' | 'chats' | 'users' = '';

    constructor(chats: Sidebar, users: Sidebar) {
        this.chatsSidebar = chats;
        this.expandChats = document.createElement('img');
        this.expandChats.classList.add('button', 'expand-chats');
        this.expandChats.alt = 'Expand Chats';
        this.expandChats.src = '/img/expand-right.svg';
        this.logo = document.createElement('img');
        this.logo.classList.add('topbar-logo');
        this.logo.alt = 'Logo';
        this.name = document.createElement('span');
        this.name.classList.add('topbar-name');
        this.description = document.createElement('span');
        this.description.classList.add('topbar-description');
        this.usersSidebar = users;
        this.expandUsers = document.createElement('img');
        this.expandUsers.classList.add('button', 'expand-users');
        this.expandUsers.alt = 'Expand Users';
        this.expandUsers.src = '/img/expand-left.svg';
    }

    appendTo(page: Page) {
        const topbar = document.createElement('div');
        topbar.classList.add('container', 'topbar');
        const marquee = document.createElement('div');
        marquee.classList.add('box', 'marquee-big');
        marquee.appendChild(this.logo);
        marquee.appendChild(this.description);
        topbar.appendChild(this.expandChats);
        topbar.appendChild(this.logo);
        topbar.appendChild(marquee);
        topbar.appendChild(this.expandUsers);
        page.appendMain(topbar);
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
                this.chatsSidebar.expand(true);
            }
            else {
                this.expandChats.src = '/img/collapse.svg';
                this.usersSidebar.expand(true);
            }
            this.expanded = sidebar;
        }
        else {
            if(this.expanded == 'chats') {
                this.expandUsers.src = '/img/expand-left.svg';
                this.chatsSidebar.expand(false);
            }
            else {
                this.expandChats.src = '/img/expand-right.svg';
                this.usersSidebar.expand(false);
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
    private readonly chats: Map<number, Chat> = new Map();
    private readonly chatsSidebar: Sidebar;
    private readonly main: HTMLDivElement;
    private readonly topbar: Topbar;
    private readonly messages: Messages;
    private readonly users: Map<number, User> = new Map();
    private readonly usersSidebar: Sidebar;

    constructor() {
        this.page = RequireNonNull.getElementById('page') as HTMLDivElement;
        this.chatsSidebar = new Sidebar();
        this.main = document.createElement('div');
        this.main.classList.add('main');
        this.usersSidebar = new Sidebar();
        this.topbar = new Topbar(this.chatsSidebar, this.usersSidebar);
        this.messages = new Messages();
        this.topbar.appendTo(this);
        this.messages.appendTo(this);
        this.chatsSidebar.appendTo(this);
        this.page.appendChild(this.main);
        this.usersSidebar.appendTo(this);
        $.ajax({
            url: '/api/chats',
            method: 'GET',
            success: (res: Response): void => {
                for(const c of res.chats) {
                    const chat = new Chat(c.id, c.permissionLevel, c.lastMessageId, c.lastReadMessageId);
                    this.chats.set(chat.id, chat);
                    chat.appendTo(this.chatsSidebar);
                }
            },
            statusCode: defaultStatusCode
        });
    }

    appendChild(node: Node): void {
        this.page.appendChild(node);
    }

    appendMain(node: Node): void {
        this.main.appendChild(node);
    }
}

const page = new Page();
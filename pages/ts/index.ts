import { loadCustomization } from "./load-customization.js";
import { Auth, PermissionLevel, PermissionLevels, RequireNonNull, Response, defaultStatusCode, imageButtonAnimationKeyframes, imageButtonAnimationOptions, setDynamicallyUpdatedDate } from "./utils.js";

declare function io(): Socket;
type Event = 'user-online' | 'user-username-status' | 'user-pfp' |
    'chat-user-join' | 'chat-user-leave' | 'chat-name-description' | 'chat-logo' | 'chat-user-permission-level' |
    'message-new' | 'message-edit' | 'message-delete' | 'mark-as-read' |
    'connect';
type Data = { [index: string]: any; };
type Socket = {
    on(event: Event, callback: (data: Data) => void ): void;
    emit(event: 'connect-main', data: Data): void;
};

await loadCustomization();

const userId = await new Promise<number>((resolve: (id: number) => void): void => {
    $.ajax({
        url: '/api/settings/id',
        method: 'GET',
        success: (res: Response): void => {
            resolve(res.id);
        },
        statusCode: defaultStatusCode
    });
});

function reloadAnimations(): void {
    const animations = document.getAnimations();
    for(let animation of animations)
        animation.cancel();
    for(let animation of animations)
        animation.play();
}

type JsonChat = {
    id: number;
    permissionLevel: PermissionLevel;
    lastMessageId: number;
    lastReadMessageId: number;
};

class Chat {
    public readonly id: number;
    private permissionLevel: PermissionLevel;
    public lastMessageId: number;
    private lastReadMessageId: number;
    public readonly box: HTMLDivElement;
    public readonly name: HTMLSpanElement;
    public readonly description: HTMLSpanElement;
    public readonly logo: HTMLImageElement;
    private readonly read: HTMLDivElement;
    private readonly actions: HTMLDivElement;
    private readonly leave: HTMLImageElement;
    private readonly settings: HTMLImageElement;
    private readonly markAsRead: HTMLImageElement;
    private readonly topbar: Topbar;

    constructor(chat: JsonChat, topbar: Topbar, navigator: Navigator) {
        this.id = chat.id;
        this.permissionLevel = chat.permissionLevel;
        this.lastMessageId = chat.lastMessageId;
        this.lastReadMessageId = chat.lastReadMessageId;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat');
        this.box.addEventListener('click', (): void => {
            navigator.selectChat(this.id);
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
            this.leave.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            $.ajax({
                url: '/api/chats/' + this.id + '/leave',
                method: 'POST',
                success: (): void => {},
                statusCode: defaultStatusCode
            });
        });
        this.settings = document.createElement('img');
        this.settings.classList.add('button');
        this.settings.alt = 'Settings';
        this.settings.src = '/img/settings.svg';
        this.settings.addEventListener('click', (): void => {
            this.settings.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            window.location.href = '/chats/' + this.id + '/settings';
        });
        this.markAsRead = document.createElement('img');
        this.markAsRead.classList.add('button');
        this.markAsRead.alt = 'Mark as Read';
        this.markAsRead.src = '/img/mark-as-read.svg';
        this.markAsRead.addEventListener('click', (): void => {
            this.markAsRead.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            //TODO
        });
        this.actions.appendChild(this.leave);
        this.actions.appendChild(this.settings);
        this.actions.appendChild(this.markAsRead);
        this.topbar = topbar;
        this.updateSelected(false);
        this.updateRead(this.lastMessageId, this.lastReadMessageId);
        this.updatePermissionLevel(this.permissionLevel);
        $.ajax({
            url: '/api/chats/' + this.id,
            method: 'GET',
            success: (res: Response): void => {
                this.updateNameDescription(res.name, res.description);
                this.updateLogo(res.logo);
            },
            statusCode: defaultStatusCode
        });
    }

    appendTo(sidebar: Sidebar, position: number | undefined = undefined): void {
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
        sidebar.insertAtPosition(this.box, position);
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

    updatePermissionLevel(permissionLevel: PermissionLevel): void {
        this.permissionLevel = permissionLevel;
        this.settings.style.display = permissionLevel == 'ADMINISTRATOR' ? '' : 'none';
    }

    updateNameDescription(name: string, description: string): void {
        this.name.innerText = name;
        this.description.innerText = description;
        if(this.topbar.id == this.id)
            this.topbar.update(this);
    }

    updateLogo(logo: string): void {
        this.logo.src = logo;
        if(this.topbar.id == this.id)
            this.topbar.update(this);
    }

    updateRead(lastMessageId: number, lastReadMessageId: number): void {
        this.lastMessageId = lastMessageId;
        this.lastReadMessageId = lastReadMessageId;
        if(lastMessageId < lastReadMessageId)
            this.read.classList.replace('unread', 'read');
        else
            this.read.classList.replace('read', 'unread');
    }
}

class NoChats {
    public readonly box: HTMLDivElement;
    public readonly name: HTMLSpanElement;
    public readonly description: HTMLSpanElement;
    public readonly logo: HTMLImageElement;

    constructor() {
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat', 'selected');
        this.name = document.createElement('span');
        this.name.classList.add('name');
        this.name.innerText = 'No Chats';
        this.description = document.createElement('span');
        this.description.classList.add('description');
        this.description.innerText = 'Create a new Chat!';
        this.logo = document.createElement('img');
        this.logo.classList.add('logo');
        this.logo.alt = 'Logo';
        this.logo.src = '/img/unknown.svg';
    }

    appendTo(sidebar: Sidebar): void {
        const logoMarquee = document.createElement('div');
        logoMarquee.classList.add('container', 'logo-marquee');
        const logoRead = document.createElement('div');
        logoRead.classList.add('logo');
        logoRead.appendChild(this.logo);
        const marquee = document.createElement('div');
        marquee.classList.add('box', 'marquee');
        marquee.appendChild(this.name);
        marquee.appendChild(this.description);
        logoMarquee.appendChild(logoRead);
        logoMarquee.appendChild(marquee);
        this.box.appendChild(logoMarquee);
        sidebar.appendChild(this.box);
    }
}

type JsonUser = {
    userId: number;
    permissionLevel: PermissionLevel;
};

class User {
    public readonly id: number;
    public permissionLevel: PermissionLevel;
    public readonly box: HTMLDivElement;
    public readonly username: HTMLSpanElement;
    public readonly status: HTMLSpanElement;
    public readonly pfp: HTMLImageElement;
    private readonly online: HTMLDivElement;
    private readonly info: HTMLDivElement;
    private readonly lastOnline: HTMLSpanElement;
    private readonly statusExtended: HTMLSpanElement;
    private readonly at: HTMLImageElement;

    constructor(user: JsonUser, navigator: Navigator) {
        this.id = user.userId;
        this.permissionLevel = user.permissionLevel;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'user');
        this.box.addEventListener('click', (): void => {
            navigator.selectUser(this.id); //! FIX
        });
        this.username = document.createElement('span');
        this.username.classList.add('name');
        this.status = document.createElement('span');
        this.status.classList.add('description');
        this.pfp = document.createElement('img');
        this.pfp.classList.add('logo');
        this.pfp.alt = 'Logo';
        this.online = document.createElement('div');
        this.online.classList.add('offline');
        this.info = document.createElement('div');
        this.info.classList.add('box', 'info');
        this.lastOnline = document.createElement('span');
        this.lastOnline.classList.add('last-online');
        this.statusExtended = document.createElement('span');
        this.statusExtended.classList.add('status-extended');
        const actions = document.createElement('div');
        actions.classList.add('container', 'actions');
        this.at = document.createElement('img');
        this.at.classList.add('button');
        this.at.alt = 'At';
        this.at.src = '/img/at.svg';
        this.at.addEventListener('click', (): void => {
            this.at.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            //TODO
        });
        actions.appendChild(this.at);
        this.info.appendChild(this.lastOnline);
        this.info.appendChild(this.statusExtended);
        this.info.appendChild(actions);
        if(this.id == userId) {
            const settings = document.createElement('img');
            settings.classList.add('button');
            settings.alt = 'Settings';
            settings.src = '/img/settings.svg';
            settings.addEventListener('click', (): void => {
                settings.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
                window.location.href = '/settings';
            });
            actions.appendChild(settings);
            const createChat = document.createElement('img');
            createChat.classList.add('button');
            createChat.alt = 'Create Chat';
            createChat.src = '/img/chat-create.svg';
            createChat.addEventListener('click', (): void => {
                createChat.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
                window.location.href = '/chats/create';
            });
            actions.appendChild(createChat);
        }
        this.updateSelected(false);
        this.updatePermissionLevel(this.permissionLevel);
        $.ajax({
            url: '/api/users/' + this.id,
            method: 'GET',
            success: (res: Response): void => {
                this.updateUsernameStatus(res.username, res.status);
                this.updatePpf(res.pfp);
                this.updateOnline(res.online, res.lastOnline);
            },
            statusCode: [] //TODO
        });
    }

    appendTo(sidebar: Sidebar, position: number | undefined = undefined): void {
        const logoMarquee = document.createElement('div');
        logoMarquee.classList.add('container', 'logo-marquee');
        const logoRead = document.createElement('div');
        logoRead.classList.add('logo');
        logoRead.appendChild(this.pfp);
        logoRead.appendChild(this.online);
        const marquee = document.createElement('div');
        marquee.classList.add('box', 'marquee');
        marquee.appendChild(this.username);
        marquee.appendChild(this.status);
        logoMarquee.appendChild(logoRead);
        logoMarquee.appendChild(marquee);
        this.box.appendChild(logoMarquee);
        this.box.appendChild(this.info);
        sidebar.insertAtPosition(this.box, position);
    }

    updateSelected(selected: boolean): void {
        if(selected) {
            this.box.classList.add('selected');
            this.info.style.display = '';
        }
        else {
            this.box.classList.remove('selected');
            this.info.style.display = 'none';
        }
    }

    updatePermissionLevel(permissionLevel: PermissionLevel): void {
        this.permissionLevel = permissionLevel;
        for(const pl of PermissionLevels)
            this.username.classList.remove('permission-level-' + pl.toLowerCase());
        this.username.classList.add('permission-level-' + permissionLevel.toLowerCase());
    }

    updateUsernameStatus(username: string, status: string): void {
        this.username.innerText = username;
        this.status.innerText = status;
        this.statusExtended.innerText = status;
    }

    updatePpf(pfp: string): void {
        this.pfp.src = pfp;
    }

    updateOnline(online: boolean, lastOnline: string): void {
        setDynamicallyUpdatedDate(this.lastOnline, new Date(lastOnline), 'Last Online: $');
        if(online) {
            this.online.classList.replace('offline', 'online');
            this.lastOnline.style.display = 'none';
        }
        else {
            this.online.classList.replace('online', 'offline');
            this.lastOnline.style.display = '';
        }
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

    insertAtPosition(node: Node, position: number | undefined = undefined): void {
        if(position == undefined || position == this.getNumberOfChilds() - 1)
            this.appendChild(node);
        else
            this.sidebar.insertBefore(node, this.getNthChild(position + 1));
    }

    removeChild(node: Node): void {
        this.sidebar.removeChild(node);
    }

    getNumberOfChilds(): number {
        return this.sidebar.childNodes.length;
    }

    getNthChild(position: number): Node {
        return this.sidebar.childNodes[position];
    }

    empty(): void {
        this.sidebar.innerHTML = '';
    }

    appendTo(page: Page): void {
        page.appendChild(this.sidebar);
    }

    expand(expand: boolean) {
        this.sidebar.style.display = expand ? 'flex' : '';
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
    public id: number | undefined = undefined;
    private expanded: '' | 'chats' | 'users' = '';

    constructor(chats: Sidebar, users: Sidebar) {
        this.chatsSidebar = chats;
        this.expandChats = document.createElement('img');
        this.expandChats.classList.add('button', 'expand-chats');
        this.expandChats.alt = 'Expand Chats';
        this.expandChats.src = '/img/expand-right.svg';
        this.expandChats.addEventListener('click', (): void => {
            this.expandChats.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.expand('chats');
        });
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
        this.expandUsers.addEventListener('click', (): void => {
            this.expandUsers.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.expand('users');
        });
        window.addEventListener('resize', (): void => {
            let temp = this.name.style.animation;
            this.name.style.display = 'none';
            this.name.style.animation = 'none';
            this.name.offsetHeight;
            this.name.style.animation = temp;
            this.name.style.display = '';
            this.description.style.display = 'none';
            temp = this.description.style.animation;
            this.description.style.animation = 'none';
            this.description.offsetHeight;
            this.description.style.animation = temp;
            this.description.style.display = '';
            reloadAnimations();
        });
    }

    appendTo(page: Page) {
        const topbar = document.createElement('div');
        topbar.classList.add('container', 'topbar');
        const marquee = document.createElement('div');
        marquee.classList.add('box', 'marquee-big');
        marquee.appendChild(this.name);
        marquee.appendChild(this.description);
        topbar.appendChild(this.expandChats);
        topbar.appendChild(this.logo);
        topbar.appendChild(marquee);
        topbar.appendChild(this.expandUsers);
        page.appendMain(topbar);
    }

    update(chat: Chat | NoChats): void {
        if(chat instanceof Chat)
            this.id = chat.id;
        this.name.innerText = chat.name.innerText;
        this.description.innerText = chat.description.innerText;
        this.logo.src = chat.logo.src;
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

class Navigator {
    private readonly chats: Map<number, Chat>;
    private readonly chatsSidebar: Sidebar;
    private readonly noChats: NoChats;
    public selectedChatId: number;
    private readonly topbar: Topbar;
    private readonly users: Map<number, User>;
    public selectedUserId: number;
    private readonly usersSidebar: Sidebar;
    private readonly loading: Loading;

    constructor(chats: Map<number, Chat>, chatsSidebar: Sidebar, topbar: Topbar, users: Map<number, User>, usersSidebar: Sidebar, loading: Loading) {
        this.chats = chats;
        this.chatsSidebar = chatsSidebar;
        this.noChats = new NoChats();
        this.selectedChatId = 0;
        this.topbar = topbar;
        this.users = users;
        this.selectedUserId = 0;
        this.usersSidebar = usersSidebar;
        this.loading = loading;
    }

    selectChat(id: number): void {
        const chat = this.chats.get(id);
        if(chat == undefined)
            return;
        this.selectedChatId = id;
        this.loading.show(true);
        this.topbar.update(chat);
        this.users.clear();
        this.usersSidebar.empty();
        for(const chat of this.chats.values())
            chat.updateSelected(chat.id == id);
        $.ajax({
            url: '/api/chats/' + id + '/users',
            method: 'GET',
            success: (res: Response): void => {
                res.users.sort((a: JsonUser, b: JsonUser): number => {
                    if(a.userId == userId) return -1;
                    if(b.userId == userId) return 1;
                    const p = PermissionLevel.compare(a.permissionLevel, b.permissionLevel);
                    if(p == 0)
                        return a.userId - b.userId;
                    return p;
                });
                for(const u of res.users) {
                    const user = new User(u, this);
                    this.users.set(user.id, user);
                    user.appendTo(this.usersSidebar);
                }
                this.selectUser(userId);
                reloadAnimations();
                this.loading.show(false);
            },
            statusCode: defaultStatusCode
        });
    }

    selectUser(id: number): void {
        this.selectedUserId = id;
        for(const user of this.users.values())
            user.updateSelected(user.id == id);
    }

    handleZeroChats(): void {
        if(this.chats.size > 0) {
            if(this.chats.size < this.chatsSidebar.getNumberOfChilds()) {
                this.chatsSidebar.removeChild(this.noChats.box);
                this.selectChat(this.chats.values().next().value.id);
            }
        }
        else {
            if(this.chatsSidebar.getNumberOfChilds() == 0) {
                this.noChats.appendTo(this.chatsSidebar);
                const user = new User({ userId: userId, permissionLevel: "USER" }, this);
                this.usersSidebar.empty();
                user.appendTo(this.usersSidebar);
                user.updateSelected(true);
                this.topbar.update(this.noChats);
                reloadAnimations();
                this.loading.show(false);
            }
        }
    }
}

class Updater {
    private readonly chats: Map<number, Chat>;
    private readonly chatsSidebar: Sidebar;
    private readonly topbar: Topbar;
    private readonly users: Map<number, User>;
    private readonly usersSidebar: Sidebar;
    private readonly socket: Socket;
    private readonly navigator: Navigator;

    constructor(chats: Map<number, Chat>, chatsSidebar: Sidebar, topbar: Topbar, users: Map<number, User>, usersSidebar: Sidebar, navigator: Navigator) {
        this.chats = chats;
        this.chatsSidebar = chatsSidebar;
        this.topbar = topbar;
        this.users = users;
        this.usersSidebar = usersSidebar;
        this.navigator = navigator;
        this.socket = io();
        this.socket.on('connect', (data: Data): void => {
            this.socket.emit('connect-main', { auth: Auth.getCookie() });
        });
        this.socket.on('chat-name-description', (data: Data): void => {
            const chat = this.chats.get(data.id);
            if(chat != undefined)
                chat.updateNameDescription(data.name, data.description);
        });
        this.socket.on('chat-logo', (data: Data): void => {
            const chat = this.chats.get(data.id);
            if(chat != undefined)
                chat.updateLogo(data.logo);
        });
        this.socket.on('chat-user-permission-level', (data: Data): void => {
            const chat = this.chats.get(data.chatId);
            if(chat == undefined)
                return;
            if(data.userId == 0)
                chat.updatePermissionLevel(data.permissionLevel);
            const user = this.users.get(data.userId);
            if(user != undefined)
                user.updatePermissionLevel(data.permissionLevel);
        });
        this.socket.on('chat-user-join', (data: Data): void => {
            if(data.userId == userId) {
                this.addChat({
                    id: data.chatId,
                    permissionLevel: data.permissionLevel,
                    lastMessageId: data.lastMessageId,
                    lastReadMessageId: data.lastReadMessageId
                });
            }
            else if(data.chatId == navigator.selectedChatId) {
                this.addUser({
                    userId: data.userId,
                    permissionLevel: data.permissionLevel
                });
            }
        });
        this.socket.on('chat-user-leave', (data: Data): void => {
            if(data.userId == userId)
                this.removeChat(data.chatId); //TODO: only 1 chat
            else if(data.chatId == navigator.selectedChatId)
                this.removeUser(data.userId);
        });
        this.socket.on('user-online', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user != undefined)
                user.updateOnline(data.online, data.lastOnline);
        });
        this.socket.on('user-username-status', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user != undefined)
                user.updateUsernameStatus(data.username, data.status);
        });
        this.socket.on('user-pfp', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user != undefined)
                user.updatePpf(data.pfp);
        });
    }

    addChat(c: JsonChat): void {
        const chat = new Chat(c, this.topbar, this.navigator);
        this.chats.set(chat.id, chat);
        const chats = Array.from(this.chats.values());
        chats.sort((a: Chat, b: Chat): number => {
            return b.lastMessageId - a.lastMessageId;
        });
        chat.appendTo(this.chatsSidebar, chats.indexOf(chat));
        this.navigator.handleZeroChats();
    }

    addUser(u: JsonUser): void {
        const user = new User(u, this.navigator);
        this.users.set(user.id, user);
        const users = Array.from(this.users.values());
        users.sort((a: User, b: User): number => {
            if(a.id == userId) return -1;
            if(b.id == userId) return 1;
            const p = PermissionLevel.compare(a.permissionLevel, b.permissionLevel);
            if(p == 0)
                return a.id - b.id;
            return p;
        });
        user.appendTo(this.usersSidebar, users.indexOf(user));
    }

    removeChat(id: number): void {
        const chat = this.chats.get(id);
        if(chat == undefined)
            return;
        this.chats.delete(id);
        this.chatsSidebar.removeChild(chat.box);
        if(this.navigator.selectedChatId == id && this.chats.size > 0)
            this.navigator.selectChat(this.chats.values().next().value.id);
        this.navigator.handleZeroChats();
    }

    removeUser(id: number): void {
        const user = this.users.get(id);
        if(user == undefined)
            return;
        this.users.delete(id);
        this.usersSidebar.removeChild(user.box);
        if(this.navigator.selectedUserId == id)
            this.navigator.selectUser(this.users.values().next().value.id);
    }

    
}

class Loading {
    private readonly loading: HTMLDivElement;

    constructor() {
        this.loading = RequireNonNull.getElementById('loading') as HTMLDivElement;
    }

    show(show: boolean): void {
        this.loading.style.display = show ? '' : 'none';
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
    private readonly loading: Loading;
    private readonly navigator: Navigator;
    private readonly updater: Updater;

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
        this.loading = new Loading();
        this.loading.show(true);
        this.navigator = new Navigator(this.chats, this.chatsSidebar, this.topbar, this.users, this.usersSidebar, this.loading);
        this.updater = new Updater(this.chats, this.chatsSidebar, this.topbar, this.users, this.usersSidebar, this.navigator);
        $.ajax({
            url: '/api/chats',
            method: 'GET',
            success: (res: Response): void => {
                res.chats.sort((a: JsonChat, b: JsonChat): number => {
                    return b.lastMessageId - a.lastMessageId;
                });
                for(const c of res.chats) {
                    const chat = new Chat(c, this.topbar, this.navigator);
                    this.chats.set(chat.id, chat);
                    chat.appendTo(this.chatsSidebar);
                }
                if(res.chats.length > 0)
                    this.navigator.selectChat(res.chats[0].id);
                else
                    this.navigator.handleZeroChats();
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
import { emojis } from "./emoji.js";
import { loadCustomization } from "./load-customization.js";
import { Auth, PermissionLevel, PermissionLevels, RequireNonNull, Response, defaultStatusCode, imageButtonAnimationKeyframes, imageButtonAnimationOptions, setDynamicallyUpdatedDate } from "./utils.js";

declare function io(): Socket;
type Event = 'user-online' | 'user-username-status' | 'user-pfp' |
    'chat-user-join' | 'chat-user-leave' | 'chat-name-description' | 'chat-logo' | 'chat-user-permission-level' |
    'chat-message-send' | 'chat-message-edit' | 'chat-message-delete' | 'chat-mark-as-read' |
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
    public permissionLevel: PermissionLevel;
    public lastMessageId: number;
    public lastReadMessageId: number;
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
            $.ajax({
                url: '/api/chats/' + this.id + '/mark-as-read',
                method: 'POST',
                success: (res: Response): void => {},
                statusCode: defaultStatusCode
            });
        });
        this.actions.appendChild(this.leave);
        this.actions.appendChild(this.settings);
        this.actions.appendChild(this.markAsRead);
        this.topbar = topbar;
        this.updateSelected(false);
        this.updateRead();
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

    updateLastMessageId(lastMessageId: number): void {
        this.lastMessageId = lastMessageId;
        this.updateRead();
    }

    updateLastReadMessageId(lastReadMessageId: number): void {
        this.lastReadMessageId = lastReadMessageId;
        this.updateRead();
    }

    updateRead(): void {
        if(this.lastMessageId > this.lastReadMessageId)
            this.read.classList.replace('read', 'unread');
        else
            this.read.classList.replace('unread', 'read');
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
    permissionLevel: PermissionLevel | "REMOVED";
};

class User {
    public readonly id: number;
    public permissionLevel: PermissionLevel | "REMOVED";
    public readonly box: HTMLDivElement;
    public readonly username: HTMLSpanElement;
    public readonly status: HTMLSpanElement;
    public readonly pfp: HTMLImageElement;
    private readonly online: HTMLDivElement;
    private readonly info: HTMLDivElement;
    private readonly lastOnline: HTMLSpanElement;
    private readonly statusExtended: HTMLSpanElement;
    private readonly tag: HTMLImageElement;
    public readonly loading: Promise<void>;

    constructor(user: JsonUser, navigator: Navigator, textarea: Textarea) {
        this.id = user.userId;
        this.permissionLevel = user.permissionLevel;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'user');
        this.box.addEventListener('click', (): void => {
            navigator.selectUser(this.id);
        });
        this.username = document.createElement('span');
        this.username.classList.add('name');
        this.status = document.createElement('span');
        this.status.classList.add('description');
        this.pfp = document.createElement('img');
        this.pfp.classList.add('logo');
        this.pfp.alt = 'Profile Picture';
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
        this.tag = document.createElement('img');
        this.tag.classList.add('button');
        this.tag.alt = 'At';
        this.tag.src = '/img/at.svg';
        this.tag.addEventListener('click', (): void => {
            this.tag.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            textarea.tagUser(this.id);
        });
        actions.appendChild(this.tag);
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
        this.loading = new Promise<void>((resolve: () => void): void => {
            $.ajax({
                url: '/api/users/' + this.id,
                method: 'GET',
                success: (res: Response): void => {
                    this.updateUsernameStatus(res.username, res.status);
                    this.updatePpf(res.pfp);
                    this.updateOnline(res.online, res.lastOnline);
                    resolve();
                },
                statusCode: defaultStatusCode
            });
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
        if(position == undefined || position == this.getNumberOfChilds())
            this.appendChild(node);
        else
            this.sidebar.insertBefore(node, this.getNthChild(position));
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

type JsonMessage = {
    id: number;
    createdAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    message: string;
    userId: number;
};

class Message {
    public readonly id: number;
    public readonly userId: number;
    private readonly box: HTMLDivElement;
    private readonly pfp: HTMLImageElement;
    private readonly username: HTMLSpanElement;
    private readonly created: HTMLDivElement;
    private readonly createdAt: HTMLSpanElement;
    private readonly edited: HTMLDivElement;
    private readonly editedAt: HTMLSpanElement;
    private readonly deleted: HTMLDivElement;
    private readonly deletedAt: HTMLSpanElement;
    private readonly message: HTMLSpanElement;
    private readonly actions: HTMLDivElement;
    private readonly edit: HTMLImageElement;
    private readonly delete: HTMLImageElement;
    private readonly messages: Messages;
    private messageText: string = '';

    constructor(message: JsonMessage, permissionLevel: PermissionLevel, messages: Messages, textarea: Textarea, user: User) {
        this.id = message.id;
        this.userId = message.userId;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'message');
        this.pfp = document.createElement('img');
        this.pfp.classList.add('message-pfp');
        this.pfp.alt = 'Profile Picture';
        this.username = document.createElement('span');
        this.username.classList.add('message-username');
        this.created = document.createElement('div');
        this.created.classList.add('container');
        this.createdAt = document.createElement('span');
        this.createdAt.classList.add('message-meta');
        this.edited = document.createElement('div');
        this.edited.classList.add('container');
        this.editedAt = document.createElement('span');
        this.editedAt.classList.add('message-meta');
        this.deleted = document.createElement('div');
        this.deleted.classList.add('container');
        this.deletedAt = document.createElement('span');
        this.deletedAt.classList.add('message-meta');
        this.message = document.createElement('span');
        this.message.classList.add('message-text');
        this.message.addEventListener('click', (): void => {
            messages.selectMessage(this.id);
        });
        this.actions = document.createElement('div');
        this.actions.classList.add('container', 'actions');
        this.edit = document.createElement('img');
        this.edit.classList.add('button');
        this.edit.alt = 'Edit';
        this.edit.src = '/img/edit.svg';
        this.edit.addEventListener('click', (): void => {
            this.edit.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            textarea.updateTextarea(this.messageText);
            textarea.editingMessageId = this.id;
        });
        this.delete = document.createElement('img');
        this.delete.classList.add('button');
        this.delete.alt = 'Delete';
        this.delete.src = '/img/delete.svg';
        this.delete.addEventListener('click', (): void => {
            this.delete.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            $.ajax({
                url: '/api/chats/' + textarea.chatId + '/messages/' + this.id,
                method: 'DELETE',
                success: async (res: Response): Promise<void> => {},
                statusCode: defaultStatusCode
            });
        });
        this.messages = messages;
        setDynamicallyUpdatedDate(this.createdAt, new Date(message.createdAt));
        this.updateSelected(false);
        this.updateMessage(message.message);
        this.updateEditedAt(message.editedAt);
        this.updateDeletedAt(message.deletedAt);
        this.updateEditDelete(permissionLevel);
        this.updateUsername(user.username.innerText);
        this.updatePfp(user.pfp.src);
        this.updatePermissionLevel(user.permissionLevel);
    }

    appendTo(messages: Messages, position: number | undefined = undefined): void {
        const messageData = document.createElement('div');
        messageData.classList.add('container', 'message-data');
        const messageMeta = document.createElement('div');
        messageMeta.classList.add('container', 'message-meta');
        const created = document.createElement('img');
        created.classList.add('message-meta');
        created.alt = 'Created';
        created.src = '/img/send.svg';
        this.created.appendChild(created);
        this.created.appendChild(this.createdAt);
        const edited = document.createElement('img');
        edited.classList.add('message-meta');
        edited.alt = 'Created';
        edited.src = '/img/edit.svg';
        this.edited.appendChild(edited);
        this.edited.appendChild(this.editedAt);
        const deleted = document.createElement('img');
        deleted.classList.add('message-meta');
        deleted.alt = 'Created';
        deleted.src = '/img/delete.svg';
        this.deleted.appendChild(deleted);
        this.deleted.appendChild(this.deletedAt);
        messageMeta.appendChild(this.created);
        messageMeta.appendChild(this.edited);
        messageMeta.appendChild(this.deleted);
        messageData.appendChild(this.pfp);
        messageData.appendChild(this.username);
        messageData.appendChild(messageMeta);
        this.actions.appendChild(this.edit);
        this.actions.appendChild(this.delete);
        const messageActions = document.createElement('div');
        messageActions.classList.add('box', 'message-actions');
        messageActions.appendChild(this.message);
        messageActions.appendChild(this.actions);
        this.box.appendChild(messageData);
        this.box.appendChild(messageActions);
        messages.insertAtPosition(this.box, position);
    }

    updateSelected(selected: boolean): void {
        if(selected) {
            this.message.classList.add('selected');
            this.actions.style.display = '';
        }
        else {
            this.message.classList.remove('selected');
            this.actions.style.display = 'none';
        }
    }

    async updateMessage(message: string): Promise<void> {
        this.messageText = message;
        const regExp = /@(\d{1,9})/g;
        for(let match = regExp.exec(message); match != null; match = regExp.exec(message)) {
            const userId =  parseInt(match[1]);
            const span = document.createElement('span');
            span.classList.add('tag', 'tag-' + userId);
            const user = await this.messages.getUser(userId);
            span.innerText = '@' + user.username.innerText;
            span.classList.add('permission-level-' + user.permissionLevel.toLowerCase());
            message = message.replace('@' + userId, span.outerHTML);
        }
        this.message.innerHTML = message;
    }
    
    updateEditedAt(editedAt: string | null): void {
        if(editedAt == null)
            this.edited.style.display = 'none';
        else {
            this.edited.style.display = '';
            setDynamicallyUpdatedDate(this.editedAt, new Date(editedAt));
        }
    }

    updateDeletedAt(deletedAt: string | null): void {
        if(deletedAt == null)
            this.deleted.style.display = 'none';
        else {
            this.deleted.style.display = '';
            this.edit.style.display = 'none';
            this.delete.style.display = 'none';
            setDynamicallyUpdatedDate(this.deletedAt, new Date(deletedAt));
        }
    }

    updateEditDelete(permissionLevel: PermissionLevel): void {
        if(this.deletedAt.innerText != '') {
            this.edit.style.display = 'none';
            this.delete.style.display = 'none';
        }
        else if(this.userId == userId) {
            this.edit.style.display = '';
            this.delete.style.display = '';
        }
        else {
            this.edit.style.display = 'none';
            this.delete.style.display = (permissionLevel == "ADMINISTRATOR" || permissionLevel == "MODERATOR") ? '' : 'none';
        }
    }

    updateUsername(username: string): void {
        this.username.innerText = username;
    }

    updatePfp(pfp: string): void {
        this.pfp.src = pfp;
    }

    updatePermissionLevel(permissionLevel: PermissionLevel | "REMOVED"): void {
        for(const pl of PermissionLevels)
            this.username.classList.remove('permission-level-' + pl.toLowerCase());
        if(permissionLevel != "REMOVED")
            this.username.classList.remove('permission-level-removed');
        this.username.classList.add('permission-level-' + permissionLevel.toLowerCase());
    }

    updateTagsUsername(userId: number, username: string): void {
        for(const tag of document.getElementsByClassName('tag-' + userId) as HTMLCollectionOf<HTMLSpanElement>)
            tag.innerText = username;
    }

    updateTagsPermissionLevel(userId: number, permissionLevel: PermissionLevel | "REMOVED"): void {
        for(const tag of document.getElementsByClassName('tag-' + userId) as HTMLCollectionOf<HTMLSpanElement>) {
            for(const pl of PermissionLevels)
                tag.classList.remove('permission-level-' + pl.toLowerCase());
            if(permissionLevel != "REMOVED")
                tag.classList.remove('permission-level-removed');
            tag.classList.add('permission-level-' + permissionLevel.toLowerCase());
        }
    }
}

class Messages {
    private readonly box: HTMLDivElement;
    private readonly loadMore: HTMLDivElement;
    private readonly unreadMessages: HTMLDivElement;
    private readonly messages: Map<number, Message> = new Map();
    private readonly users: Map<number, User>;
    private readonly removedUsers: Map<number, User> = new Map();
    private readonly textarea: Textarea;
    private navigator: Navigator | undefined = undefined;

    constructor(users: Map<number, User>, textarea: Textarea) {
        this.box = document.createElement('div');
        this.box.classList.add('box', 'messages');
        this.loadMore = document.createElement('div');
        this.loadMore.classList.add('load-more');
        const button = document.createElement('button');
        button.innerText = 'Load More';
        const icon = document.createElement('img');
        icon.classList.add('button');
        icon.alt = 'Load More';
        icon.src = '/img/load-more.svg';
        button.appendChild(icon);
        button.addEventListener('click', (): void => {
            this.loadMoreMessages();
        });
        this.loadMore.appendChild(button);
        this.appendChild(this.loadMore);
        this.unreadMessages = document.createElement('div');
        this.unreadMessages.classList.add('unread-messages');
        const span = document.createElement('span');
        span.innerText = 'Unread Messages';
        this.unreadMessages.appendChild(span);
        this.users = users;
        this.textarea = textarea;
    }

    appendTo(page: Page): void {
        page.appendMain(this.box);
    }

    loadMessages(chat: Chat, navigator: Navigator): void {
        this.navigator = navigator;
        this.empty();
        this.messages.clear();
        $.ajax({
            url: '/api/chats/' + chat.id + '/messages',
            method: 'GET',
            success: async (res: Response): Promise<void> => {
                this.beforeInsert();
                for(const m of res.messages) {
                    const user = await this.getUser(m.userId);
                    const message = new Message(m, chat.permissionLevel, this, this.textarea, user);
                    this.messages.set(message.id, message);
                    message.appendTo(this);
                }
                this.afterInsert();
                this.scrollToUnread();
            },
            statusCode: defaultStatusCode
        });
    }

    loadMoreMessages(): void {
        if(this.navigator == undefined)
            return;
        const chat = this.navigator.getSelectedChat();
        const beforeMessageId = this.toOrderedArray()[0].id;
        $.ajax({
            url: '/api/chats/' + chat.id + '/messages',
            data: { beforeMessageId: beforeMessageId },
            method: 'GET',
            success: async (res: Response): Promise<void> => {
                const scrolledToBottom = this.isScrolledToBottom();
                const scrolledToUnread = this.isScrolledToUnread();
                for(const m of res.messages) {
                    const user = await this.getUser(m.userId);
                    const message = new Message(m, chat.permissionLevel, this, this.textarea, user);
                    this.messages.set(message.id, message);
                }
                const messages = this.toOrderedArray();
                this.beforeInsert();
                for(const m of res.messages) {
                    const message = this.messages.get(m.id);
                    if(message != undefined)
                        message.appendTo(this, messages.indexOf(message));
                }
                this.afterInsert();
                if(scrolledToBottom)
                    this.scrollToBottom();
                else if(scrolledToUnread)
                    this.scrollToUnread();
            },
            statusCode: defaultStatusCode
        });
    }

    updateUnreadMessages(): void {
        if(this.navigator == undefined)
            return;
        const chat = this.navigator.getSelectedChat();
        this.removeChild(this.unreadMessages);
        if(chat.lastMessageId > chat.lastReadMessageId) {
            const message = this.messages.get(chat.lastReadMessageId);
            if(message == undefined)
                this.insertAtPosition(this.unreadMessages, 0);
            else
                this.insertAtPosition(this.unreadMessages, this.toOrderedArray().indexOf(message) + 1);
        }
    }

    beforeInsert(): void {
        this.removeChild(this.loadMore);
        this.removeChild(this.unreadMessages);
    }

    afterInsert(): void {
        this.updateUnreadMessages();
        this.insertAtPosition(this.loadMore, 0);
    }

    selectMessage(id: number): void {
        for(const message of this.messages.values())
            message.updateSelected(message.id == id);
    }

    updateUsername(userId: number, username: string): void {
        for(const message of this.messages.values()) {
            message.updateTagsUsername(userId, username);
            if(message.userId == userId)
                message.updateUsername(username);
        }
    }

    updatePfp(userId: number, pfp: string): void {
        for(const message of this.messages.values()) {
            if(message.userId == userId)
                message.updatePfp(pfp);
        }
    }

    updatePermissionLevel(userId: number, permissionLevel: PermissionLevel | "REMOVED"): void {
        for(const message of this.messages.values()) {
            message.updateTagsPermissionLevel(userId, permissionLevel);
            if(message.userId == userId)
                message.updatePermissionLevel(permissionLevel);
        }
    }

    updateEditDelete(permissionLevel: PermissionLevel): void {
        for(const message of this.messages.values())
            message.updateEditDelete(permissionLevel);
    }

    appendChild(node: Node): void {
        this.box.appendChild(node);
    }

    insertAtPosition(node: Node, position: number | undefined = undefined): void {
        if(position == undefined || position == this.getNumberOfChilds())
            this.appendChild(node);
        else
            this.box.insertBefore(node, this.getNthChild(position));
        this.isScrolledToBottom();
    }

    removeChild(node: Node): void {
        try {
            this.box.removeChild(node);
        } catch(_: any) {}
    }

    getNumberOfChilds(): number {
        return this.box.childNodes.length;
    }

    getNthChild(position: number): Node {
        return this.box.childNodes[position];
    }

    empty(): void {
        this.box.innerHTML = '';
    }

    toOrderedArray(): Message[] {
        const messages = Array.from(this.messages.values());
        messages.sort((a: Message, b: Message): number => {
            return a.id - b.id;
        });
        return messages;
    }

    set(key: number, value: Message): void {
        this.messages.set(key, value);
    }

    get(key: number): Message | undefined {
        return this.messages.get(key);
    }

    async getUser(id: number): Promise<User> {
        let user = this.users.get(id);
        if(user == undefined) {
            user = this.removedUsers.get(id);
            if(user == undefined) {
                if(this.navigator == undefined)
                    throw new Error('this.navigator is undefined');
                user = new User({ userId: id, permissionLevel: "REMOVED" }, this.navigator, this.textarea);
                this.removedUsers.set(user.id, user);
                await user.loading;
            }
        }
        return user;
    }

    isScrolledToBottom(): boolean {
        return this.box.scrollTop >= this.box.scrollHeight - (this.box.clientHeight * 1.1);
    }

    scrollToBottom(): void {
        this.box.scrollTo(0, this.box.scrollHeight - this.box.clientHeight);
    }

    isScrolledToUnread(): boolean {
        const childNodes = Array.from(this.box.childNodes);
        if(!childNodes.includes(this.unreadMessages))
            return this.isScrolledToBottom();
        let scroll = this.unreadMessages.offsetTop - this.unreadMessages.clientHeight * 4;
        const maxScroll = this.box.scrollHeight - this.box.clientHeight;
        if(scroll > maxScroll)
            scroll = maxScroll;
        return this.unreadMessages.scrollTop == scroll;
    }

    scrollToUnread(): void {
        const childNodes = Array.from(this.box.childNodes);
        if(!childNodes.includes(this.unreadMessages)) {
            this.scrollToBottom();
            return;
        }
        this.box.scrollTo(0, this.unreadMessages.offsetTop - this.unreadMessages.clientHeight * 4);
    }
}

class Textarea {
    private readonly container: HTMLDivElement;
    private readonly textarea: HTMLTextAreaElement;
    private readonly max: number = 2048;
    private readonly send: HTMLImageElement;
    private readonly emoji: HTMLImageElement;
    private readonly counter: HTMLSpanElement;
    private readonly emojiSelector: HTMLDivElement;
    private emojiSelectorVisible: boolean = false;
    public chatId: number = 0;
    public editingMessageId: number | undefined = undefined;

    constructor() {
        this.container = document.createElement('div');
        this.container.classList.add('container', 'textarea');
        this.textarea = document.createElement('textarea');
        this.textarea.autocapitalize = 'none';
        this.textarea.spellcheck = false;
        this.textarea.rows = 2;
        this.textarea.addEventListener('keydown', (ev: HTMLElementEventMap['keydown']): void => {
            this.updateTextarea(ev);
        });
        this.textarea.addEventListener('keyup', (ev: HTMLElementEventMap['keyup']): void => {
            this.updateTextarea(ev);
        });
        this.send = document.createElement('img');
        this.send.classList.add('button');
        this.send.alt = 'Send';
        this.send.src = '/img/send.svg';
        this.send.addEventListener('click', (): void => {
            this.sendMessage();
        });
        this.emoji = document.createElement('img');
        this.emoji.classList.add('button');
        this.emoji.alt = 'Emoji';
        this.emoji.src = '/img/emoji.svg';
        this.emoji.addEventListener('click', (): void => {
            this.emoji.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.showEmojiSelector(!this.emojiSelectorVisible);
        });
        this.counter = document.createElement('span');
        this.counter.classList.add('counter');
        this.updateCounter(0);
        this.emojiSelector = document.createElement('div');
        this.emojiSelector.classList.add('box', 'emoji-selector');
        for(const e of emojis) {
            const span = document.createElement('span');
            span.classList.add('emoji');
            span.innerText = e;
            span.addEventListener('click', (): void => {
                this.updateTextarea(e);
            });
            this.emojiSelector.appendChild(span);
        }
        this.showEmojiSelector(false);
    }

    appendTo(page: Page): void {
        const actionsCounter = document.createElement('div');
        actionsCounter.classList.add('box', 'actions-counter');
        const actions = document.createElement('div');
        actions.classList.add('container', 'actions');
        actions.appendChild(this.send);
        actions.appendChild(this.emoji);
        actionsCounter.appendChild(actions);
        actionsCounter.appendChild(this.counter);
        actionsCounter.appendChild(this.emojiSelector);
        this.container.appendChild(this.textarea);
        this.container.appendChild(actionsCounter);
        page.appendMain(this.container);
    }

    show(show: boolean): void {
        this.container.style.display = show ? '' : 'none';
    }

    getMessage(): string {
        let message = '';
        for(const line of this.textarea.value.split('\n'))
            message += line.trim() + '\n';
        return message.trim();
    }

    updateTextarea(ev: { code: string; shiftKey: boolean; type: string; } | string): void {
        if(typeof ev == 'string')
            this.textarea.value += ev;
        const message = this.getMessage();
        const chars = message.length;
        const lines = this.textarea.value.split('\n').length;
        this.updateCounter(chars);
        this.textarea.rows = lines < 2 ? 2 : (lines > 6 ? 6 : lines);
        if(typeof ev != 'string' && ev.code == 'Enter' && !ev.shiftKey) {
            if(ev.type == 'keydown')
                this.sendMessage();
            else
                this.textarea.value = '';
        }
    }

    tagUser(id: number): void {
        if(this.textarea.value != '') {
            const lastChar = this.textarea.value[this.textarea.value.length - 1];
            if(lastChar != ' ' && lastChar != '\n')
                this.textarea.value += ' ';
        }
        this.updateTextarea('@' + id);
    }

    updateCounter(count: number): void {
        this.counter.innerText = count + '/' + this.max;
        if(count > this.max)
            this.counter.classList.add('error');
        else
            this.counter.classList.remove('error');
    }

    showEmojiSelector(show: boolean): void {
        this.emojiSelectorVisible = show;
        this.emojiSelector.style.display = show ? '' : 'none';
    }

    sendMessage(): void {
        const message = this.getMessage();
        if(message.length > this.max)
            return;
        this.send.animate([
            { transform: 'rotate(0deg)', offset: 0 },
            { transform: 'rotate(-90deg)', offset: 0.2 },
            { transform: 'translate(0, -10px) rotate(-90deg)', offset: 0.3 },
            { transform: 'translate(0, -10px) rotate(-270deg)', offset: 0.6 },
            { transform: 'translate(0, 0) rotate(-270deg)', offset: 0.9 },
            { transform: 'rotate(0deg)', offset: 1 }
        ], { duration: 700 });
        if(this.editingMessageId == undefined) {
            $.ajax({
                url: '/api/chats/' + this.chatId + '/messages',
                method: 'POST',
                data: JSON.stringify({
                    message: message
                }),
                contentType: 'application/json',
                success: async (res: Response): Promise<void> => {},
                statusCode: defaultStatusCode
            });
        }
        else {
            $.ajax({
                url: '/api/chats/' + this.chatId + '/messages/' + this.editingMessageId,
                method: 'PATCH',
                data: JSON.stringify({
                    message: message
                }),
                contentType: 'application/json',
                success: async (res: Response): Promise<void> => {},
                statusCode: defaultStatusCode
            });
            this.editingMessageId = undefined;
        }
        this.textarea.value = '';
    }
}

class Navigator {
    private readonly chats: Map<number, Chat>;
    private readonly chatsSidebar: Sidebar;
    private readonly noChats: NoChats;
    public selectedChatId: number;
    private readonly topbar: Topbar;
    private readonly messages: Messages;
    private readonly textarea: Textarea;
    private readonly users: Map<number, User>;
    public selectedUserId: number;
    private readonly usersSidebar: Sidebar;
    private readonly loading: Loading;

    constructor(chats: Map<number, Chat>, chatsSidebar: Sidebar, topbar: Topbar, messages: Messages, textarea: Textarea,
                users: Map<number, User>, usersSidebar: Sidebar, loading: Loading) {
        this.chats = chats;
        this.chatsSidebar = chatsSidebar;
        this.noChats = new NoChats();
        this.selectedChatId = 0;
        this.topbar = topbar;
        this.messages = messages;
        this.textarea = textarea;
        this.users = users;
        this.selectedUserId = 0;
        this.usersSidebar = usersSidebar;
        this.loading = loading;
    }

    selectChat(id: number): void {
        if(this.selectedChatId == id)
            return;
        const chat = this.chats.get(id);
        if(chat == undefined)
            return;
        this.selectedChatId = id;
        this.loading.show(true);
        this.topbar.update(chat);
        this.textarea.chatId = id;
        this.textarea.show(chat.permissionLevel != "VIEWER");
        this.users.clear();
        this.usersSidebar.empty();
        for(const chat of this.chats.values())
            chat.updateSelected(chat.id == id);
        $.ajax({
            url: '/api/chats/' + id + '/users',
            method: 'GET',
            success: async (res: Response): Promise<void> => {
                res.users.sort((a: JsonUser, b: JsonUser): number => {
                    if(a.userId == userId) return -1;
                    if(b.userId == userId) return 1;
                    const p = PermissionLevel.compare(a.permissionLevel, b.permissionLevel);
                    if(p == 0)
                        return a.userId - b.userId;
                    return p;
                });
                for(const u of res.users) {
                    const user = new User(u, this, this.textarea);
                    this.users.set(user.id, user);
                    user.appendTo(this.usersSidebar);
                }
                this.selectUser(userId);
                for(const user of this.users.values())
                    await user.loading;
                reloadAnimations();
                this.messages.loadMessages(chat, this);
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
                const user = new User({ userId: userId, permissionLevel: "USER" }, this, this.textarea);
                this.usersSidebar.empty();
                user.appendTo(this.usersSidebar);
                user.updateSelected(true);
                this.topbar.update(this.noChats);
                reloadAnimations();
                this.loading.show(false);
            }
        }
    }

    getSelectedChat(): Chat {
        const chat = this.chats.get(this.selectedChatId);
        if(chat == undefined)
            throw new Error('this.selectedChatId is undefined');
        return chat;
    }
}

class Updater {
    private readonly chats: Map<number, Chat>;
    private readonly chatsSidebar: Sidebar;
    private readonly topbar: Topbar;
    private readonly messages: Messages;
    private readonly textarea: Textarea;
    private readonly users: Map<number, User>;
    private readonly usersSidebar: Sidebar;
    private readonly socket: Socket;
    private readonly navigator: Navigator;

    constructor(chats: Map<number, Chat>, chatsSidebar: Sidebar, topbar: Topbar, messages: Messages, textarea: Textarea,
                users: Map<number, User>, usersSidebar: Sidebar, navigator: Navigator) {
        this.chats = chats;
        this.chatsSidebar = chatsSidebar;
        this.topbar = topbar;
        this.messages = messages;
        this.textarea = textarea;
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
            if(data.userId == userId)
                chat.updatePermissionLevel(data.permissionLevel);
            if(data.chatId == this.navigator.selectedChatId) {
                this.messages.updatePermissionLevel(data.userId, data.permissionLevel);
                if(data.userId == userId)
                    this.messages.updateEditDelete(data.permissionLevel);
            }
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
            else if(data.chatId == this.navigator.selectedChatId) {
                this.addUser({
                    userId: data.userId,
                    permissionLevel: data.permissionLevel
                });
                this.messages.updatePermissionLevel(data.userId, data.permissionLevel);
            }
        });
        this.socket.on('chat-user-leave', (data: Data): void => {
            if(data.userId == userId)
                this.removeChat(data.chatId);
            else if(data.chatId == navigator.selectedChatId) {
                this.removeUser(data.userId);
                this.messages.updatePermissionLevel(data.userId, "REMOVED");
            }
        });
        this.socket.on('chat-message-send', (data: Data): void => {
            const chat = this.chats.get(data.chatId);
            if(chat == undefined)
                return;
            chat.updateLastMessageId(data.id);
            if(data.chatId == navigator.selectedChatId) {
                this.addMessage({
                    id: data.id,
                    chatId: data.chatId,
                    userId: data.userId,
                    message: data.message,
                    createdAt: data.createdAt,
                    editedAt: null,
                    deletedAt: null
                });
            }
        });
        this.socket.on('chat-message-edit', (data: Data): void => {
            if(data.chatId != navigator.selectedChatId) 
                return;
            const message = messages.get(data.id);
            if(message == undefined)
                return;
            message.updateMessage(data.message);
            message.updateEditedAt(data.editedAt);
        });
        this.socket.on('chat-message-delete', (data: Data): void => {
            if(data.chatId != navigator.selectedChatId) 
                return;
            const message = messages.get(data.id);
            if(message == undefined)
                return;
            message.updateMessage(data.message);
            message.updateDeletedAt(data.deletedAt);
        });
        this.socket.on('chat-mark-as-read', (data: Data): void => {
            const chat = this.chats.get(data.chatId);
            if(chat == undefined)
                return;
            chat.updateLastReadMessageId(data.lastReadMessageId);
            this.messages.updateUnreadMessages();
        });
        this.socket.on('user-online', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user != undefined)
                user.updateOnline(data.online, data.lastOnline);
        });
        this.socket.on('user-username-status', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user == undefined)
                return;
            user.updateUsernameStatus(data.username, data.status);
            this.messages.updateUsername(data.id, data.username);
        });
        this.socket.on('user-pfp', (data: Data): void => {
            const user = this.users.get(data.id);
            if(user == undefined)
                return;
            user.updatePpf(data.pfp);
            this.messages.updatePfp(data.id, data.pfp);
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
        const user = new User(u, this.navigator, this.textarea);
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

    addMessage(m: JsonMessage & { chatId: number }): void {
        const scrolledToBottom = this.messages.isScrolledToBottom();
        const scrolledToUnread = this.messages.isScrolledToUnread();
        const user = this.users.get(m.userId);
        const chat = this.chats.get(m.chatId);
        if(user == undefined || chat == undefined)
            return;
        const message = new Message(m, chat.permissionLevel, this.messages, this.textarea, user);
        this.messages.set(message.id, message);
        const messages = this.messages.toOrderedArray();
        this.messages.beforeInsert();
        message.appendTo(this.messages, messages.indexOf(message));
        this.messages.afterInsert();
        if(scrolledToBottom)
            this.messages.scrollToBottom();
        else if(scrolledToUnread)
            this.messages.scrollToUnread();
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
    private readonly textarea: Textarea;
    private readonly users: Map<number, User> = new Map();
    private readonly usersSidebar: Sidebar;
    private readonly loading: Loading;
    private readonly navigator: Navigator;
    private readonly updater: Updater;

    constructor() {
        this.loading = new Loading();
        this.loading.show(true);
        this.page = RequireNonNull.getElementById('page') as HTMLDivElement;
        this.chatsSidebar = new Sidebar();
        this.main = document.createElement('div');
        this.main.classList.add('box', 'main');
        this.usersSidebar = new Sidebar();
        this.topbar = new Topbar(this.chatsSidebar, this.usersSidebar);
        this.textarea = new Textarea();
        this.messages = new Messages(this.users, this.textarea);
        this.topbar.appendTo(this);
        this.messages.appendTo(this);
        this.textarea.appendTo(this);
        this.chatsSidebar.appendTo(this);
        this.page.appendChild(this.main);
        this.usersSidebar.appendTo(this);
        this.navigator = new Navigator(this.chats, this.chatsSidebar, this.topbar, this.messages, this.textarea, this.users, this.usersSidebar, this.loading);
        this.updater = new Updater(this.chats, this.chatsSidebar, this.topbar, this.messages, this.textarea, this.users, this.usersSidebar, this.navigator);
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
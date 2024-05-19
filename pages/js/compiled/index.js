import { loadCustomization } from "./load-customization.js";
import { RequireNonNull, defaultStatusCode } from "./utils.js";
await loadCustomization();
function reloadAnimations() {
    const animations = document.getAnimations();
    for (let animation of animations)
        animation.cancel();
    for (let animation of animations)
        animation.play();
}
class Chat {
    constructor(chat, topbar, navigator) {
        this.id = chat.id;
        this.permissionLevel = chat.permissionLevel;
        this.lastMessageId = chat.lastMessageId;
        this.lastReadMessageId = chat.lastReadMessageId;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat');
        this.box.addEventListener('click', () => {
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
        this.leave.addEventListener('click', () => {
            //TODO
        });
        this.settings = document.createElement('img');
        this.settings.classList.add('button');
        this.settings.alt = 'Settings';
        this.settings.src = '/img/settings.svg';
        this.settings.addEventListener('click', () => {
            window.location.href = '/chats/' + this.id + '/settings';
        });
        this.markAsRead = document.createElement('img');
        this.markAsRead.classList.add('button');
        this.markAsRead.alt = 'Mark as Read';
        this.markAsRead.src = '/img/mark-as-read.svg';
        this.markAsRead.addEventListener('click', () => {
            //TODO
        });
        this.actions.appendChild(this.leave);
        this.actions.appendChild(this.settings);
        this.actions.appendChild(this.markAsRead);
        this.topbar = topbar;
        this.updateSelected(false);
        this.updateRead(this.lastMessageId, this.lastReadMessageId);
        $.ajax({
            url: '/api/chats/' + this.id,
            method: 'GET',
            success: (res) => {
                this.updateSettings(this.permissionLevel, res.name, res.description, res.logo);
            },
            statusCode: defaultStatusCode
        });
    }
    appendTo(sidebar) {
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
    updateSelected(selected) {
        if (selected) {
            this.box.classList.add('selected');
            this.actions.style.display = '';
        }
        else {
            this.box.classList.remove('selected');
            this.actions.style.display = 'none';
        }
    }
    updateSettings(permissionLevel, name, description, logo) {
        this.permissionLevel = permissionLevel;
        this.settings.style.display = permissionLevel == 'ADMINISTRATOR' ? 'none' : '';
        this.name.innerText = name;
        this.description.innerText = description;
        this.logo.src = logo;
        if (this.topbar.id == this.id)
            this.topbar.update(this);
    }
    updateRead(lastMessageId, lastReadMessageId) {
        this.lastMessageId = lastMessageId;
        this.lastReadMessageId = lastReadMessageId;
        if (lastMessageId > lastReadMessageId)
            this.read.classList.replace('unread', 'read');
        else
            this.read.classList.replace('read', 'unread');
    }
}
class User {
    constructor(id) {
        this.id = id;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'chat');
        this.box.addEventListener('click', () => {
            this.updateSelected(true);
        });
        $.ajax({
            url: '/api/users/' + id,
            method: 'GET',
            success: (res) => {
            },
            statusCode: defaultStatusCode
        });
    }
    appendTo(page) {
    }
    updateSelected(selected) {
    }
    updateSettings(permissionLevel, name, description, logo) {
    }
}
class Sidebar {
    constructor() {
        this.sidebar = document.createElement('div');
        this.sidebar.classList.add('box', 'sidebar');
    }
    appendChild(node) {
        this.sidebar.appendChild(node);
    }
    removeChild(node) {
        this.sidebar.removeChild(node);
    }
    appendTo(page) {
        page.appendChild(this.sidebar);
    }
    expand(expand) {
        this.sidebar.style.display = expand ? '' : 'flex';
    }
}
class Topbar {
    constructor(chats, users) {
        this.id = undefined;
        this.expanded = '';
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
        window.addEventListener('resize', () => {
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
    appendTo(page) {
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
    update(chat) {
        this.name.innerText = chat.name.innerText;
        this.description.innerText = chat.description.innerText;
        this.logo.src = chat.logo.src;
    }
    expand(sidebar) {
        if (this.expanded == sidebar)
            return;
        if (this.expanded == '') {
            if (sidebar == 'chats') {
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
            if (this.expanded == 'chats') {
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
    appendTo(page) {
    }
}
class Navigator {
    constructor(chats, topbar, users) {
        this.chats = chats;
        this.topbar = topbar;
        this.users = users;
    }
    selectChat(id) {
        this.topbar.id = id;
        for (const chat of this.chats.values())
            chat.updateSelected(chat.id == id);
    }
    selectUser(id) {
    }
}
class Updater {
    constructor(chats, users) {
        this.chats = chats;
        this.users = users;
        //TODO
    }
}
class Page {
    constructor() {
        this.chats = new Map();
        this.users = new Map();
        this.page = RequireNonNull.getElementById('page');
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
        this.navigator = new Navigator(this.chats, this.topbar, this.users);
        $.ajax({
            url: '/api/chats',
            method: 'GET',
            success: (res) => {
                res.chats.sort((a, b) => {
                    return a.lastMessageId - b.lastMessageId;
                });
                for (const c of res.chats) {
                    const chat = new Chat(c, this.topbar, this.navigator);
                    this.chats.set(chat.id, chat);
                    chat.appendTo(this.chatsSidebar);
                }
                this.navigator.selectChat(res.chats[0].id);
            },
            statusCode: defaultStatusCode
        });
    }
    appendChild(node) {
        this.page.appendChild(node);
    }
    appendMain(node) {
        this.main.appendChild(node);
    }
}
const page = new Page();

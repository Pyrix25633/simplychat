import { emojis } from "./emoji.js";
import { loadCustomization } from "./load-customization.js";
import { Auth, PermissionLevel, PermissionLevels, RequireNonNull, defaultStatusCode, imageButtonAnimationKeyframes, imageButtonAnimationOptions, setDynamicallyUpdatedDate } from "./utils.js";
await loadCustomization();
const userId = await new Promise((resolve) => {
    $.ajax({
        url: '/api/settings/id',
        method: 'GET',
        success: (res) => {
            resolve(res.id);
        },
        statusCode: defaultStatusCode
    });
});
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
            this.leave.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            $.ajax({
                url: '/api/chats/' + this.id + '/leave',
                method: 'POST',
                success: () => { },
                statusCode: defaultStatusCode
            });
        });
        this.settings = document.createElement('img');
        this.settings.classList.add('button');
        this.settings.alt = 'Settings';
        this.settings.src = '/img/settings.svg';
        this.settings.addEventListener('click', () => {
            this.settings.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            window.location.href = '/chats/' + this.id + '/settings';
        });
        this.markAsRead = document.createElement('img');
        this.markAsRead.classList.add('button');
        this.markAsRead.alt = 'Mark as Read';
        this.markAsRead.src = '/img/mark-as-read.svg';
        this.markAsRead.addEventListener('click', () => {
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
            success: (res) => {
                this.updateNameDescription(res.name, res.description);
                this.updateLogo(res.logo);
            },
            statusCode: defaultStatusCode
        });
    }
    appendTo(sidebar, position = undefined) {
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
    updatePermissionLevel(permissionLevel) {
        this.permissionLevel = permissionLevel;
        this.settings.style.display = permissionLevel == 'ADMINISTRATOR' ? '' : 'none';
    }
    updateNameDescription(name, description) {
        this.name.innerText = name;
        this.description.innerText = description;
        if (this.topbar.id == this.id)
            this.topbar.update(this);
    }
    updateLogo(logo) {
        this.logo.src = logo;
        if (this.topbar.id == this.id)
            this.topbar.update(this);
    }
    updateRead(lastMessageId, lastReadMessageId) {
        this.lastMessageId = lastMessageId;
        this.lastReadMessageId = lastReadMessageId;
        if (lastMessageId < lastReadMessageId)
            this.read.classList.replace('unread', 'read');
        else
            this.read.classList.replace('read', 'unread');
    }
}
class NoChats {
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
    appendTo(sidebar) {
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
class User {
    constructor(user, navigator, textarea) {
        this.id = user.userId;
        this.permissionLevel = user.permissionLevel;
        this.box = document.createElement('div');
        this.box.classList.add('box', 'user');
        this.box.addEventListener('click', () => {
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
        this.at = document.createElement('img');
        this.at.classList.add('button');
        this.at.alt = 'At';
        this.at.src = '/img/at.svg';
        this.at.addEventListener('click', () => {
            this.at.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            textarea.atUser(this.id);
        });
        actions.appendChild(this.at);
        this.info.appendChild(this.lastOnline);
        this.info.appendChild(this.statusExtended);
        this.info.appendChild(actions);
        if (this.id == userId) {
            const settings = document.createElement('img');
            settings.classList.add('button');
            settings.alt = 'Settings';
            settings.src = '/img/settings.svg';
            settings.addEventListener('click', () => {
                settings.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
                window.location.href = '/settings';
            });
            actions.appendChild(settings);
            const createChat = document.createElement('img');
            createChat.classList.add('button');
            createChat.alt = 'Create Chat';
            createChat.src = '/img/chat-create.svg';
            createChat.addEventListener('click', () => {
                createChat.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
                window.location.href = '/chats/create';
            });
            actions.appendChild(createChat);
        }
        this.updateSelected(false);
        this.updatePermissionLevel(this.permissionLevel);
        this.loading = new Promise((resolve) => {
            $.ajax({
                url: '/api/users/' + this.id,
                method: 'GET',
                success: (res) => {
                    this.updateUsernameStatus(res.username, res.status);
                    this.updatePpf(res.pfp);
                    this.updateOnline(res.online, res.lastOnline);
                    resolve();
                },
                statusCode: defaultStatusCode
            });
        });
    }
    appendTo(sidebar, position = undefined) {
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
    updateSelected(selected) {
        if (selected) {
            this.box.classList.add('selected');
            this.info.style.display = '';
        }
        else {
            this.box.classList.remove('selected');
            this.info.style.display = 'none';
        }
    }
    updatePermissionLevel(permissionLevel) {
        this.permissionLevel = permissionLevel;
        for (const pl of PermissionLevels)
            this.username.classList.remove('permission-level-' + pl.toLowerCase());
        this.username.classList.add('permission-level-' + permissionLevel.toLowerCase());
    }
    updateUsernameStatus(username, status) {
        this.username.innerText = username;
        this.status.innerText = status;
        this.statusExtended.innerText = status;
    }
    updatePpf(pfp) {
        this.pfp.src = pfp;
    }
    updateOnline(online, lastOnline) {
        setDynamicallyUpdatedDate(this.lastOnline, new Date(lastOnline), 'Last Online: $');
        if (online) {
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
    constructor() {
        this.sidebar = document.createElement('div');
        this.sidebar.classList.add('box', 'sidebar');
    }
    appendChild(node) {
        this.sidebar.appendChild(node);
    }
    insertAtPosition(node, position = undefined) {
        if (position == undefined || position == this.getNumberOfChilds() - 1)
            this.appendChild(node);
        else
            this.sidebar.insertBefore(node, this.getNthChild(position + 1));
    }
    removeChild(node) {
        this.sidebar.removeChild(node);
    }
    getNumberOfChilds() {
        return this.sidebar.childNodes.length;
    }
    getNthChild(position) {
        return this.sidebar.childNodes[position];
    }
    empty() {
        this.sidebar.innerHTML = '';
    }
    appendTo(page) {
        page.appendChild(this.sidebar);
    }
    expand(expand) {
        this.sidebar.style.display = expand ? 'flex' : '';
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
        this.expandChats.addEventListener('click', () => {
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
        this.expandUsers.addEventListener('click', () => {
            this.expandUsers.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.expand('users');
        });
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
        if (chat instanceof Chat)
            this.id = chat.id;
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
class Message {
    constructor(message, permissionLevel, messages, textarea, user) {
        this.messageText = '';
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
        this.message.addEventListener('click', () => {
            messages.selectMessage(this.id);
        });
        this.actions = document.createElement('div');
        this.actions.classList.add('container', 'actions');
        this.edit = document.createElement('img');
        this.edit.classList.add('button');
        this.edit.alt = 'Edit';
        this.edit.src = '/img/edit.svg';
        this.edit.addEventListener('click', () => {
            this.edit.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            textarea.updateTextarea(this.messageText);
            textarea.editingMessageId = this.id;
        });
        this.delete = document.createElement('img');
        this.delete.classList.add('button');
        this.delete.alt = 'Delete';
        this.delete.src = '/img/delete.svg';
        this.delete.addEventListener('click', () => {
            this.delete.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            $.ajax({
                url: '/api/chats/' + textarea.chatId + '/message/' + this.id,
                method: 'DELETE',
                success: async (res) => { },
                statusCode: defaultStatusCode
            });
        });
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
    appendTo(messages, position = undefined) {
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
    updateSelected(selected) {
        if (selected) {
            this.message.classList.add('selected');
            this.actions.style.display = '';
        }
        else {
            this.message.classList.remove('selected');
            this.actions.style.display = 'none';
        }
    }
    updateMessage(message) {
        this.messageText = message;
        this.message.innerText = message; //TODO
    }
    updateEditedAt(editedAt) {
        if (editedAt == null)
            this.edited.style.display = 'none';
        else {
            this.edited.style.display = '';
            setDynamicallyUpdatedDate(this.editedAt, new Date(editedAt));
        }
    }
    updateDeletedAt(deletedAt) {
        if (deletedAt == null)
            this.deleted.style.display = 'none';
        else {
            this.deleted.style.display = '';
            this.edit.style.display = 'none';
            this.delete.style.display = 'none';
            setDynamicallyUpdatedDate(this.deletedAt, new Date(deletedAt));
        }
    }
    updateEditDelete(permissionLevel) {
        if (this.userId == userId) {
            this.edit.style.display = '';
            this.delete.style.display = '';
        }
        else {
            this.edit.style.display = 'none';
            this.delete.style.display = (permissionLevel == "ADMINISTRATOR" || permissionLevel == "MODERATOR") ? '' : 'none';
        }
    }
    updateUsername(username) {
        this.username.innerText = username;
    }
    updatePfp(pfp) {
        this.pfp.src = pfp;
    }
    updatePermissionLevel(permissionLevel) {
        for (const pl of PermissionLevels)
            this.username.classList.remove('permission-level-' + pl.toLowerCase());
        if (permissionLevel != "REMOVED")
            this.username.classList.remove('permission-level-removed');
        this.username.classList.add('permission-level-' + permissionLevel.toLowerCase());
    }
}
class Messages {
    constructor(users, textarea) {
        this.messages = new Map();
        this.removedUsers = new Map();
        this.box = document.createElement('div');
        this.box.classList.add('box', 'messages');
        this.users = users;
        this.textarea = textarea;
    }
    appendTo(page) {
        page.appendMain(this.box);
    }
    loadMessages(chat, navigator) {
        this.empty();
        this.messages.clear();
        $.ajax({
            url: '/api/chats/' + chat.id + '/messages',
            method: 'GET',
            success: async (res) => {
                for (const m of res.messages) {
                    let user = this.users.get(m.userId);
                    if (user == undefined) {
                        user = this.removedUsers.get(m.userId);
                        if (user == undefined) {
                            user = new User({ userId: m.userId, permissionLevel: "REMOVED" }, navigator, this.textarea);
                            this.removedUsers.set(user.id, user);
                            await user.loading;
                        }
                    }
                    const message = new Message(m, chat.permissionLevel, this, this.textarea, user);
                    this.messages.set(message.id, message);
                    message.appendTo(this);
                }
            },
            statusCode: defaultStatusCode
        });
    }
    selectMessage(id) {
        for (const message of this.messages.values())
            message.updateSelected(message.id == id);
    }
    updateUsername(userId, username) {
        for (const message of this.messages.values()) {
            if (message.userId == userId)
                message.updateUsername(username);
        }
    }
    updatePfp(userId, pfp) {
        for (const message of this.messages.values()) {
            if (message.userId == userId)
                message.updatePfp(pfp);
        }
    }
    updatePermissionLevel(userId, permissionLevel) {
        for (const message of this.messages.values()) {
            if (message.userId == userId)
                message.updatePermissionLevel(permissionLevel);
        }
    }
    updateEditDelete(permissionLevel) {
        for (const message of this.messages.values())
            message.updateEditDelete(permissionLevel);
    }
    appendChild(node) {
        this.box.appendChild(node);
    }
    insertAtPosition(node, position = undefined) {
        if (position == undefined || position == this.getNumberOfChilds() - 1)
            this.appendChild(node);
        else
            this.box.insertBefore(node, this.getNthChild(position + 1));
    }
    removeChild(node) {
        this.box.removeChild(node);
    }
    getNumberOfChilds() {
        return this.box.childNodes.length;
    }
    getNthChild(position) {
        return this.box.childNodes[position];
    }
    empty() {
        this.box.innerHTML = '';
    }
    values() {
        return this.messages.values();
    }
    set(key, value) {
        this.messages.set(key, value);
    }
}
class Textarea {
    constructor() {
        this.max = 2048;
        this.emojiSelectorVisible = false;
        this.chatId = 0;
        this.editingMessageId = undefined;
        this.container = document.createElement('div');
        this.container.classList.add('container', 'textarea');
        this.textarea = document.createElement('textarea');
        this.textarea.autocapitalize = 'none';
        this.textarea.spellcheck = false;
        this.textarea.rows = 2;
        this.textarea.addEventListener('keydown', (ev) => {
            this.updateTextarea(ev);
        });
        this.textarea.addEventListener('keyup', (ev) => {
            this.updateTextarea(ev);
        });
        this.send = document.createElement('img');
        this.send.classList.add('button');
        this.send.alt = 'Send';
        this.send.src = '/img/send.svg';
        this.send.addEventListener('click', () => {
            this.sendMessage();
        });
        this.emoji = document.createElement('img');
        this.emoji.classList.add('button');
        this.emoji.alt = 'Emoji';
        this.emoji.src = '/img/emoji.svg';
        this.emoji.addEventListener('click', () => {
            this.emoji.animate(imageButtonAnimationKeyframes, imageButtonAnimationOptions);
            this.showEmojiSelector(!this.emojiSelectorVisible);
        });
        this.counter = document.createElement('span');
        this.counter.classList.add('counter');
        this.updateCounter(0);
        this.emojiSelector = document.createElement('div');
        this.emojiSelector.classList.add('box', 'emoji-selector');
        for (const e of emojis) {
            const span = document.createElement('span');
            span.classList.add('emoji');
            span.innerText = e;
            span.addEventListener('click', () => {
                this.updateTextarea(e);
            });
            this.emojiSelector.appendChild(span);
        }
        this.showEmojiSelector(false);
    }
    appendTo(page) {
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
    show(show) {
        this.container.style.display = show ? '' : 'none';
    }
    getMessage() {
        let message = '';
        for (const line of this.textarea.value.split('\n'))
            message += line.trim() + '\n';
        return message.trim();
    }
    updateTextarea(ev) {
        if (typeof ev == 'string')
            this.textarea.value += ev;
        const message = this.getMessage();
        const chars = message.length;
        const lines = this.textarea.value.split('\n').length;
        this.updateCounter(chars);
        this.textarea.rows = lines < 2 ? 2 : (lines > 6 ? 6 : lines);
        if (typeof ev != 'string' && ev.code == 'Enter' && !ev.shiftKey && ev.type == 'keydown') {
            if (ev.type == 'keydown')
                this.sendMessage();
            else
                this.textarea.value = '';
        }
    }
    atUser(id) {
        if (this.textarea.value != '') {
            const lastChar = this.textarea.value[this.textarea.value.length - 1];
            if (lastChar != ' ' && lastChar != '\n')
                this.textarea.value += ' ';
        }
        this.updateTextarea('@' + id);
    }
    updateCounter(count) {
        this.counter.innerText = count + '/' + this.max;
        if (count > this.max)
            this.counter.classList.add('error');
        else
            this.counter.classList.remove('error');
    }
    showEmojiSelector(show) {
        this.emojiSelectorVisible = show;
        this.emojiSelector.style.display = show ? '' : 'none';
    }
    sendMessage() {
        const message = this.getMessage();
        if (message.length > this.max)
            return;
        this.send.animate([
            { transform: 'rotate(0deg)', offset: 0 },
            { transform: 'rotate(-90deg)', offset: 0.2 },
            { transform: 'translate(0, -10px) rotate(-90deg)', offset: 0.3 },
            { transform: 'translate(0, -10px) rotate(-270deg)', offset: 0.6 },
            { transform: 'translate(0, 0) rotate(-270deg)', offset: 0.9 },
            { transform: 'rotate(0deg)', offset: 1 }
        ], { duration: 700 });
        if (this.editingMessageId == undefined) {
            $.ajax({
                url: '/api/chats/' + this.chatId + '/messages',
                method: 'POST',
                data: JSON.stringify({
                    message: message
                }),
                contentType: 'application/json',
                success: async (res) => { },
                statusCode: defaultStatusCode
            });
        }
        else {
            $.ajax({
                url: '/api/chats/' + this.chatId + '/message/' + this.editingMessageId,
                method: 'PATCH',
                data: JSON.stringify({
                    message: message
                }),
                contentType: 'application/json',
                success: async (res) => { },
                statusCode: defaultStatusCode
            });
            this.editingMessageId = undefined;
        }
        this.textarea.value = '';
    }
}
class Navigator {
    constructor(chats, chatsSidebar, topbar, messages, textarea, users, usersSidebar, loading) {
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
    selectChat(id) {
        const chat = this.chats.get(id);
        if (chat == undefined)
            return;
        this.selectedChatId = id;
        this.loading.show(true);
        this.topbar.update(chat);
        this.textarea.chatId = id;
        this.textarea.show(chat.permissionLevel != "VIEWER");
        this.users.clear();
        this.usersSidebar.empty();
        for (const chat of this.chats.values())
            chat.updateSelected(chat.id == id);
        $.ajax({
            url: '/api/chats/' + id + '/users',
            method: 'GET',
            success: async (res) => {
                res.users.sort((a, b) => {
                    if (a.userId == userId)
                        return -1;
                    if (b.userId == userId)
                        return 1;
                    const p = PermissionLevel.compare(a.permissionLevel, b.permissionLevel);
                    if (p == 0)
                        return a.userId - b.userId;
                    return p;
                });
                for (const u of res.users) {
                    const user = new User(u, this, this.textarea);
                    this.users.set(user.id, user);
                    user.appendTo(this.usersSidebar);
                }
                this.selectUser(userId);
                for (const user of this.users.values())
                    await user.loading;
                reloadAnimations();
                this.messages.loadMessages(chat, this);
                this.loading.show(false);
            },
            statusCode: defaultStatusCode
        });
    }
    selectUser(id) {
        this.selectedUserId = id;
        for (const user of this.users.values())
            user.updateSelected(user.id == id);
    }
    handleZeroChats() {
        if (this.chats.size > 0) {
            if (this.chats.size < this.chatsSidebar.getNumberOfChilds()) {
                this.chatsSidebar.removeChild(this.noChats.box);
                this.selectChat(this.chats.values().next().value.id);
            }
        }
        else {
            if (this.chatsSidebar.getNumberOfChilds() == 0) {
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
}
class Updater {
    constructor(chats, chatsSidebar, topbar, messages, textarea, users, usersSidebar, navigator) {
        this.chats = chats;
        this.chatsSidebar = chatsSidebar;
        this.topbar = topbar;
        this.messages = messages;
        this.textarea = textarea;
        this.users = users;
        this.usersSidebar = usersSidebar;
        this.navigator = navigator;
        this.socket = io();
        this.socket.on('connect', (data) => {
            this.socket.emit('connect-main', { auth: Auth.getCookie() });
        });
        this.socket.on('chat-name-description', (data) => {
            const chat = this.chats.get(data.id);
            if (chat != undefined)
                chat.updateNameDescription(data.name, data.description);
        });
        this.socket.on('chat-logo', (data) => {
            const chat = this.chats.get(data.id);
            if (chat != undefined)
                chat.updateLogo(data.logo);
        });
        this.socket.on('chat-user-permission-level', (data) => {
            const chat = this.chats.get(data.chatId);
            if (chat == undefined)
                return;
            if (data.userId == userId)
                chat.updatePermissionLevel(data.permissionLevel);
            if (data.chatId == this.navigator.selectedChatId) {
                this.messages.updatePermissionLevel(data.userId, data.permissionLevel);
                if (data.userId == userId)
                    this.messages.updateEditDelete(data.permissionLevel);
            }
            const user = this.users.get(data.userId);
            if (user != undefined)
                user.updatePermissionLevel(data.permissionLevel);
        });
        this.socket.on('chat-user-join', (data) => {
            if (data.userId == userId) {
                this.addChat({
                    id: data.chatId,
                    permissionLevel: data.permissionLevel,
                    lastMessageId: data.lastMessageId,
                    lastReadMessageId: data.lastReadMessageId
                });
            }
            else if (data.chatId == this.navigator.selectedChatId) {
                this.addUser({
                    userId: data.userId,
                    permissionLevel: data.permissionLevel
                });
                this.messages.updatePermissionLevel(data.userId, data.permissionLevel);
            }
        });
        this.socket.on('chat-user-leave', (data) => {
            if (data.userId == userId)
                this.removeChat(data.chatId);
            else if (data.chatId == navigator.selectedChatId) {
                this.removeUser(data.userId);
                this.messages.updatePermissionLevel(data.userId, "REMOVED");
            }
        });
        this.socket.on('chat-message-send', (data) => {
            if (data.chatId == navigator.selectedChatId)
                this.addMessage({
                    id: data.id,
                    chatId: data.chatId,
                    userId: data.userId,
                    message: data.message,
                    createdAt: data.createdAt,
                    editedAt: null,
                    deletedAt: null
                });
        });
        this.socket.on('user-online', (data) => {
            const user = this.users.get(data.id);
            if (user != undefined)
                user.updateOnline(data.online, data.lastOnline);
        });
        this.socket.on('user-username-status', (data) => {
            const user = this.users.get(data.id);
            if (user == undefined)
                return;
            user.updateUsernameStatus(data.username, data.status);
            this.messages.updateUsername(data.id, data.username);
        });
        this.socket.on('user-pfp', (data) => {
            const user = this.users.get(data.id);
            if (user == undefined)
                return;
            user.updatePpf(data.pfp);
            this.messages.updatePfp(data.id, data.pfp);
        });
    }
    addChat(c) {
        const chat = new Chat(c, this.topbar, this.navigator);
        this.chats.set(chat.id, chat);
        const chats = Array.from(this.chats.values());
        chats.sort((a, b) => {
            return b.lastMessageId - a.lastMessageId;
        });
        chat.appendTo(this.chatsSidebar, chats.indexOf(chat));
        this.navigator.handleZeroChats();
    }
    addUser(u) {
        const user = new User(u, this.navigator, this.textarea);
        this.users.set(user.id, user);
        const users = Array.from(this.users.values());
        users.sort((a, b) => {
            if (a.id == userId)
                return -1;
            if (b.id == userId)
                return 1;
            const p = PermissionLevel.compare(a.permissionLevel, b.permissionLevel);
            if (p == 0)
                return a.id - b.id;
            return p;
        });
        user.appendTo(this.usersSidebar, users.indexOf(user));
    }
    addMessage(m) {
        const user = this.users.get(m.userId);
        const chat = this.chats.get(m.chatId);
        if (user == undefined || chat == undefined)
            return;
        const message = new Message(m, chat.permissionLevel, this.messages, this.textarea, user);
        this.messages.set(message.id, message);
        const messages = Array.from(this.messages.values());
        messages.sort((a, b) => {
            return a.id - b.id;
        });
        message.appendTo(this.messages, messages.indexOf(message));
    }
    removeChat(id) {
        const chat = this.chats.get(id);
        if (chat == undefined)
            return;
        this.chats.delete(id);
        this.chatsSidebar.removeChild(chat.box);
        if (this.navigator.selectedChatId == id && this.chats.size > 0)
            this.navigator.selectChat(this.chats.values().next().value.id);
        this.navigator.handleZeroChats();
    }
    removeUser(id) {
        const user = this.users.get(id);
        if (user == undefined)
            return;
        this.users.delete(id);
        this.usersSidebar.removeChild(user.box);
        if (this.navigator.selectedUserId == id)
            this.navigator.selectUser(this.users.values().next().value.id);
    }
}
class Loading {
    constructor() {
        this.loading = RequireNonNull.getElementById('loading');
    }
    show(show) {
        this.loading.style.display = show ? '' : 'none';
    }
}
class Page {
    constructor() {
        this.chats = new Map();
        this.users = new Map();
        this.loading = new Loading();
        this.loading.show(true);
        this.page = RequireNonNull.getElementById('page');
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
            success: (res) => {
                res.chats.sort((a, b) => {
                    return b.lastMessageId - a.lastMessageId;
                });
                for (const c of res.chats) {
                    const chat = new Chat(c, this.topbar, this.navigator);
                    this.chats.set(chat.id, chat);
                    chat.appendTo(this.chatsSidebar);
                }
                if (res.chats.length > 0)
                    this.navigator.selectChat(res.chats[0].id);
                else
                    this.navigator.handleZeroChats();
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

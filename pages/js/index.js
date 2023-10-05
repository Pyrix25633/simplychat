import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";
import { emojis } from "./emoji.js";

let switchingChat = false;
enableLoadingDiv();

const chatsDiv = document.getElementById('chats');
const usersDiv = document.getElementById('users');
const chatLogoImg = document.getElementById('chat-logo');
const chatNameSpan = document.getElementById('chat-name');
const chatDescriptionSpan = document.getElementById('chat-description');
const messagesDiv = document.getElementById('messages');
const textareaDiv = document.getElementById('textarea');
const showChatsImg = document.getElementById('show-chats');
const showUsersImg = document.getElementById('show-users');
const messageTextarea = document.getElementById('message');
const messageCharsSpan = document.getElementById('message-chars');
const sendImg = document.getElementById('send');
const emojiImg = document.getElementById('emoji');
const emojiSelectorDiv = document.getElementById('emoji-selector');
emojiSelectorDiv.style.display = 'none';
for(let i = 0; i < emojis.length; i++) {
    const emojiSpan = document.createElement('span');
    emojiSpan.classList.add('emoji');
    emojiSpan.innerText = emojis[i];
    emojiSpan.addEventListener('click', () => {
        messageTextarea.value = messageTextarea.value + emojis[i];
    });
    emojiSelectorDiv.appendChild(emojiSpan);
}
const chatsCache = {};
let messagesCacheArray = [];
let messagesCache = {};
let selectedChat;
let usersCache;
let selectedUser;
let selectedMessage;
let editingMessage = null;

const socket = io();
socket.on('connect', () => {
    socket.emit('connect-user', cachedLogin);
});
socket.on('user-online', (data) => {
    if(switchingChat) return;
    const lastOnlineSpan = document.getElementById('last-online-' + data.id);
    const onlineDiv = document.getElementById('online-' + data.id);
    if(onlineDiv == null) return;
    if(data.online) {
        onlineDiv.classList.replace('offline', 'online');
        lastOnlineSpan.style.display = 'none';
    }
    else {
        onlineDiv.classList.replace('online', 'offline');
        setReadableDate(lastOnlineSpan, data.lastOnline, 'Last online: $');
        lastOnlineSpan.style.display = '';
    }
});
socket.on('user-settings', (data) => {
    if(switchingChat) return;
    $.ajax({
        url: '/api/user/info',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            userId: data.id
        }),
        contentType: 'application/json',
        success: (res) => {
            for(const pfp of document.getElementsByClassName('pfp-' + data.id))
                pfp.src = './pfps/' + data.id + '.' + res.pfpType;
            for(const username of document.getElementsByClassName('username-' + data.id))
                username.innerText = res.username;
            for(const userTag of document.getElementsByClassName('user-tag-' + data.id))
                userTag.innerText = '@' + res.username;
            for(const status of document.getElementsByClassName('status-' + data.id))
                status.innerText = res.status;
        },
        statusCode: statusCodeActions
    });
    if(data.id == cachedLogin.id) loadSettings();
});
socket.on('user-join', (data) => {
    if(data.chatId == selectedChat && !switchingChat) {
        $.ajax({
            url: '/api/user/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                userId: data.id
            }),
            contentType: 'application/json',
            success: (res) => {
                const user = res;
                user.permissionLevel = data.permissionLevel;
                let usersCacheArray = Object.values(usersCache);
                usersCacheArray.push(user);
                usersCacheArray.sort((a, b) => {
                    if(a.id == cachedLogin.id) return -1;
                    if(b.id == cachedLogin.id) return 1;
                    const p = a.permissionLevel - b.permissionLevel;
                    if(p == 0)
                        return b.lastOnline - a.lastOnline;
                    return p;
                });
                usersDiv.innerHTML = '';
                for(let user of usersCacheArray) {
                    setChatUser(user, user.id == cachedLogin.id);
                }
                usersCache[data.id] = user;
                const oldPermissionLevel = 'removed';
                const newPermissionLevel = data.permissionLevel;
                for(const username of document.getElementsByClassName('username-' + data.id)) {
                    username.classList.remove('permission-level-' + oldPermissionLevel);
                    username.classList.add('permission-level-' + newPermissionLevel);
                }
                for(const userTag of document.getElementsByClassName('user-tag-' + data.id)) {
                    userTag.classList.remove('permission-level-' + oldPermissionLevel);
                    userTag.classList.add('permission-level-' + newPermissionLevel);
                }
            },
            statusCode: statusCodeActions
        });
    }
    if(data.id == cachedLogin.id) {
        enableLoadingDiv();
        $.ajax({
            url: '/api/chat/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: data.chatId
            }),
            contentType: 'application/json',
            success: (res) => {
                chatsCache[data.chatId] = res;
                $.ajax({
                    url: '/api/chat/get-last-messages',
                    method: 'POST',
                    data: JSON.stringify({
                        token: cachedLogin.token,
                        id: cachedLogin.id,
                        chatId: data.chatId,
                        numberOfMessages: 1
                    }),
                    contentType: 'application/json',
                    success: (res) => {
                        chatsCache[data.chatId].lastMessageTimestamp = res.lastMessages[0].timestamp;
                        chatsDiv.innerHTML = '';
                        const chatsCacheArray = Object.values(chatsCache);
                        chatsCacheArray.sort((a, b) => {
                            return b.lastMessageTimestamp - a.lastMessageTimestamp;
                        });
                        loadChatUsers(chatsCache[data.chatId], () => {
                            chatsDiv.innerHTML = '';
                            for(const chat of chatsCacheArray)
                                setChatInfo(chat);
                        });
                    },
                    statusCode: statusCodeActions
                });
            },
            statusCode: statusCodeActions
        });
    }
});
socket.on('user-leave', (data) => {
    if(data.chatId == selectedChat) {
        usersDiv.removeChild(document.getElementById('user-' + data.id));
        if(data.id != cachedLogin.id && data.id == selectedUser)
            document.getElementById('user-' + cachedLogin.id).click();
        const oldPermissionLevel = usersCache[data.id].permissionLevel;
        const newPermissionLevel = 'removed';
        for(const username of document.getElementsByClassName('username-' + data.id)) {
            username.classList.remove('permission-level-' + oldPermissionLevel);
            username.classList.add('permission-level-' + newPermissionLevel);
        }
        for(const userTag of document.getElementsByClassName('user-tag-' + data.id)) {
            userTag.classList.remove('permission-level-' + oldPermissionLevel);
            userTag.classList.add('permission-level-' + newPermissionLevel);
        }
        delete usersCache[data.id];
    }
    if(data.id == cachedLogin.id) {
        chatsDiv.removeChild(document.getElementById('chat-' + data.chatId));
        delete chatsCache[data.chatId];
        if(data.chatId == selectedChat) {
            const chatsCacheArray = Object.values(chatsCache);
            chatsCacheArray.sort((a, b) => {
                return b.lastMessageTimestamp - a.lastMessageTimestamp;
            });
            document.getElementById('chat-' + chatsCacheArray[0].id).click();
        }
    }
});
socket.on('chat-settings', (data) => {
    if(data.chatId == selectedChat) {
        for(const userId of Object.keys(data.modifiedUsers)) {
            const oldPermissionLevel = usersCache[userId].permissionLevel;
            const newPermissionLevel = data.modifiedUsers[userId].permissionLevel;
            for(const username of document.getElementsByClassName('username-' + userId)) {
                username.classList.remove('permission-level-' + oldPermissionLevel);
                username.classList.add('permission-level-' + newPermissionLevel);
            }
            for(const userTag of document.getElementsByClassName('user-tag-' + userId)) {
                userTag.classList.remove('permission-level-' + oldPermissionLevel);
                userTag.classList.add('permission-level-' + newPermissionLevel);
            }
            usersCache[userId].permissionLevel = newPermissionLevel;
        }
    }
    let removedFromChat = false;
    for(const userId of data.removedUsers) {
        if(userId == cachedLogin.id) {
            removedFromChat = true;
            chatsDiv.removeChild(document.getElementById('chat-' + data.chatId));
            delete chatsCache[data.chatId];
            if(data.chatId == selectedChat) {
                const temp = parseInt(Object.keys(chatsCache)[0]);
                document.getElementById('chat-' + temp).click();
            }
        }
        else if(data.chatId == selectedChat) {
            usersDiv.removeChild(document.getElementById('user-' + userId));
            delete usersCache[userId];
        }
    }
    const settingsImg = document.getElementById('settings-' + data.chatId);
    if(data.modifiedUsers[cachedLogin.id] != undefined) {
        if(data.modifiedUsers[cachedLogin.id].permissionLevel > 0) {
            settingsImg.style.display = 'none';
            if(data.modifiedUsers[cachedLogin.id].permissionLevel > 1) {
                for(const del of document.getElementsByClassName('delete'))
                    del.style.display = 'none';
                if(selectedMessage != undefined) {
                    document.getElementById('message-' + selectedMessage).click();
                }
                if(data.modifiedUsers[cachedLogin.id].permissionLevel >= 3) {
                    textareaDiv.style.display = 'none';
                    if(editingMessage != null) {
                        messageTextarea.value = '';
                        editingMessage = null;
                    }
                }
                else textareaDiv.style.display = '';
            }
            else {
                for(const del of document.getElementsByClassName('delete'))
                    del.style.display = '';
                textareaDiv.style.display = '';
            }
        }
        else {
            settingsImg.style.display = '';
            for(const del of document.getElementsByClassName('delete'))
                del.style.display = '';
            textareaDiv.style.display = '';
        }
        chatsCache[data.chatId].users[cachedLogin] = data.modifiedUsers[cachedLogin];
    }
    if(!removedFromChat) {
        $.ajax({
            url: '/api/chat/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: data.chatId
            }),
            contentType: 'application/json',
            success: (res) => {
                for(const chatName of document.getElementsByClassName('chat-name-' + data.chatId))
                    chatName.innerText = res.name;
                for(const chatDescription of document.getElementsByClassName('chat-description-' + data.chatId))
                    chatDescription.innerText = res.description;
                for(const chatLogo of document.getElementsByClassName('chat-logo-' + data.chatId))
                    chatLogo.src = './chatLogos/' + data.chatId + '.' + res.chatLogoType;
                chatsCache[data.chatId].name = res.name;
                chatsCache[data.chatId].description = res.description;
                chatsCache[data.chatId].chatLogoType = res.chatLogoType;
            },
            statusCode: statusCodeActions
        });
    }
});
socket.on('message-send', (data) => {
    if(switchingChat) return;
    $.ajax({
        url: '/api/chat/get-message',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            chatId: data.chatId,
            messageId: data.id
        }),
        contentType: 'application/json',
        success: (res) => {
            if(data.chatId == chatsCache[selectedChat].id) addMessage(res);
            chatsCache[data.chatId].lastMessageTimestamp = res.timestamp;
            const chatsCacheArray = Object.values(chatsCache);
            chatsCacheArray.sort((a, b) => {
                return b.lastMessageTimestamp - a.lastMessageTimestamp;
            });
            chatsDiv.innerHTML = '';
            for(const chat of chatsCacheArray)
                setChatInfo(chat);
        },
        statusCode: () => {}
    });
});
socket.on('message-edit', (data) => {
    if(switchingChat) return;
    if(data.chatId == selectedChat) {
        messagesCache[data.id].message = data.message;
        messagesCache[data.id].edited = true;
        document.getElementById('message-' + data.id).innerHTML = parseMessage(data.message);
        document.getElementById('edited-' + data.id).style.display = '';
    }
});
socket.on('message-delete', (data) => {
    if(switchingChat) return;
    if(data.chatId == selectedChat)
        messagesDiv.removeChild(document.getElementById('message-' + data.id).parentElement);
});

onMessageTextareaUpdate(null);

loadSettings(() => {
    $.ajax({
        url: '/api/chat/list',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: (res) => {
            const chats = Object.keys(res.chats);
            if(chats.length > 0)
                loadChatsInfo(chats, res.chats);
            else
                disableLoadingDiv();
        },
        statusCode: statusCodeActions
    });
});

function enableLoadingDiv() {
    switchingChat = true;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerText = 'Loading...';
    document.body.appendChild(loadingDiv);
}

function disableLoadingDiv() {
    reloadAnimations();
    document.body.removeChild(document.getElementById('loading'));
    switchingChat = false;
}

function reloadAnimations() {
    const animations = document.getAnimations();
    for(let animation of animations)
        animation.cancel();
    for(let animation of animations)
        animation.play();
}

function loadChatsInfo(chats, chatsObject) {
    for(let chatId of chats) {
        $.ajax({
            url: '/api/chat/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: parseInt(chatId)
            }),
            contentType: 'application/json',
            success: (res) => {
                res.id = parseInt(chatId);
                res.lastReadMessageId = chatsObject[chatId].lastReadMessageId;
                chatsCache[chatId] = res;
                if(Object.keys(chatsCache).length == chats.length)
                    loadChatsLastMessage();
            },
            statusCode: statusCodeActions
        });
    }
}

function loadChatsLastMessage() {
    let numOfReceivedResponses = 0;
    const chatsCacheArray = Object.values(chatsCache);
    for(const chat of Object.values(chatsCache)) {
        $.ajax({
            url: '/api/chat/get-last-messages',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: chat.id,
                numberOfMessages: 1
            }),
            contentType: 'application/json',
            success: (res) => {
                numOfReceivedResponses++;
                if(res.lastMessages.length > 0)
                    chat.lastMessageTimestamp = res.lastMessages[0].timestamp;
                else
                    chat.lastMessageTimestamp = 0;
                chatsCache[chat.id].lastMessageTimestamp = chat.lastMessageTimestamp;
                if(numOfReceivedResponses == chatsCacheArray.length) {
                    chatsCacheArray.sort((a, b) => {
                        return b.lastMessageTimestamp - a.lastMessageTimestamp;
                    });
                    chatsDiv.innerHTML = '';
                    selectedChat = chatsCacheArray[0].id;
                    loadChatUsers(chatsCacheArray[0]);
                    for(const chat of chatsCacheArray)
                        setChatInfo(chat);
                }
            },
            statusCode: statusCodeActions
        });
    }
}

function setChatInfo(chat) {
    const chatDiv = document.createElement('div');
    chatDiv.id = 'chat-' + chat.id;
    chatDiv.classList.add('container', 'chat');
    if(chat.id == selectedChat) chatDiv.classList.add('selected');
    const boxDiv = document.createElement('div');
    boxDiv.classList.add('box');
    const chatInfoDiv = document.createElement('div');
    chatInfoDiv.classList.add('container');
    const nameDescriptionDiv = document.createElement('div');
    nameDescriptionDiv.classList.add('box', 'marquee');
    const chatLogoDiv = document.createElement('div');
    chatLogoDiv.classList.add('chat-logo');
    const chatLogoImg = document.createElement('img');
    chatLogoImg.classList.add('chat-logo', 'chat-logo-' + chat.id);
    chatLogoImg.src = './chatLogos/' + chat.id + '.' + chat.chatLogoType;
    chatLogoDiv.appendChild(chatLogoImg);
    chatInfoDiv.appendChild(chatLogoDiv);
    const chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('chat-name', 'chat-name-' + chat.id);
    chatNameSpan.innerText = chat.name;
    nameDescriptionDiv.appendChild(chatNameSpan);
    const chatDescriptionSpan = document.createElement('span');
    chatDescriptionSpan.classList.add('chat-description', 'chat-description-' + chat.id);
    chatDescriptionSpan.innerText = chat.description;
    nameDescriptionDiv.appendChild(chatDescriptionSpan);
    chatInfoDiv.appendChild(nameDescriptionDiv);
    boxDiv.appendChild(chatInfoDiv);
    const chatSettingsDiv = document.createElement('div');
    chatSettingsDiv.classList.add('container', 'chat-settings');
    const leaveImg = document.createElement('img');
    leaveImg.classList.add('button');
    leaveImg.src = './img/leave.svg';
    chatSettingsDiv.appendChild(leaveImg);
    leaveImg.addEventListener('click', () => {
        leaveImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        $.ajax({
            url: '/api/chat/leave',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: chat.id
            }),
            contentType: 'application/json',
            success: () => {},
            statusCode: statusCodeActions
        });
    });
    const settingsImg = document.createElement('img');
    settingsImg.id = 'settings-' + chat.id;
    settingsImg.classList.add('button');
    settingsImg.src = './img/settings.svg';
    chatSettingsDiv.appendChild(settingsImg);
    settingsImg.addEventListener('click', () => {
        settingsImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        window.location.href = '/chat-settings?id=' + chat.id;
    });
    if(chat.users[cachedLogin.id].permissionLevel > 0) settingsImg.style.display = 'none';
    const markAsReadImg = document.createElement('img');
    markAsReadImg.classList.add('button');
    markAsReadImg.src = './img/mark-as-read.svg';
    chatSettingsDiv.appendChild(markAsReadImg);
    markAsReadImg.addEventListener('click', () => {
        markAsReadImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        console.log(chat.id);
    });
    if(chat.id != selectedChat) chatSettingsDiv.style.display = 'none';
    boxDiv.appendChild(chatSettingsDiv);
    chatDiv.appendChild(boxDiv);
    chatDiv.addEventListener('click', () => {
        if(chat.id == selectedChat) return;
        editingMessage = null;
        enableLoadingDiv();
        for(let div of chatsDiv.getElementsByClassName('chat'))
            div.classList.remove('selected');
        for(let div of chatsDiv.getElementsByClassName('chat-settings'))
            div.style.display = 'none';
        chatDiv.classList.add('selected');
        chatSettingsDiv.style.display = '';
        loadChatUsers(chat);
    });
    chatsDiv.appendChild(chatDiv);
}

function setChatTopbar(selected) {
    chatLogoImg.src = '/chatLogos/' + selected.id + '.' + selected.chatLogoType;
    chatLogoImg.classList.remove('chat-logo-' + selectedChat);
    chatLogoImg.classList.add('chat-logo-' + selected.id);
    chatNameSpan.innerText = selected.name;
    chatNameSpan.classList.remove('chat-name-' + selectedChat);
    chatNameSpan.classList.add('chat-name-' + selected.id);
    chatDescriptionSpan.innerText = selected.description;
    chatDescriptionSpan.classList.remove('chat-description-' + selectedChat);
    chatDescriptionSpan.classList.add('chat-description-' + selected.id);
    if(usersCache[cachedLogin.id].permissionLevel >= 3) textareaDiv.style.display = 'none';
    else textareaDiv.style.display = '';
    selectedChat = selected.id;
}

function loadChatUsers(selected, callback) {
    usersCache = {};
    selectedUser = cachedLogin.id;
    usersDiv.innerHTML = '';
    $.ajax({
        url: '/api/chat/info',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            chatId: selected.id
        }),
        contentType: 'application/json',
        success: (chat) => {
            let numOfReceivedResponses = 0;
            const users = Object.keys(chat.users);
            for(let id of users) {
                $.ajax({
                    url: '/api/user/info',
                    method: 'POST',
                    data: JSON.stringify({
                        token: cachedLogin.token,
                        id: cachedLogin.id,
                        userId: parseInt(id)
                    }),
                    contentType: 'application/json',
                    success: (res) => {
                        const user = res;
                        user.permissionLevel = chat.users[id].permissionLevel;
                        usersCache[user.id] = user;
                        numOfReceivedResponses++;
                        if(numOfReceivedResponses == users.length) {
                            setChatUsers();
                            setChatTopbar(selected);
                            loadChatLastMessages(selected);
                            if(callback) callback();
                            disableLoadingDiv();
                        }
                    },
                    statusCode: statusCodeActions
                });
            }
        },
        statusCode: statusCodeActions
    });
}

function setChatUsers() {
    let usersCacheArray = Object.values(usersCache);
    usersCacheArray.sort((a, b) => {
        if(a.id == cachedLogin.id) return -1;
        if(b.id == cachedLogin.id) return 1;
        const p = a.permissionLevel - b.permissionLevel;
        if(p == 0)
            return b.lastOnline - a.lastOnline;
        return p;
    });
    for(let user of usersCacheArray)
        setChatUser(user);
}

function setChatUser(user) {
    const userDiv = document.createElement('div');
    userDiv.id = 'user-' + user.id;
    userDiv.classList.add('container', 'user');
    if(user.id == cachedLogin.id) userDiv.classList.add('selected');
    const boxDiv = document.createElement('div');
    boxDiv.classList.add('box');
    const userInfoDiv = document.createElement('div');
    userInfoDiv.classList.add('container');
    const usernameStatusDiv = document.createElement('div');
    usernameStatusDiv.classList.add('box', 'marquee');
    const pfpDiv = document.createElement('div');
    pfpDiv.classList.add('pfp');
    const pfpImg = document.createElement('img');
    pfpImg.classList.add('pfp', 'pfp-' + user.id);
    pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
    pfpDiv.appendChild(pfpImg);
    const onlineDiv = document.createElement('div');
    onlineDiv.id = 'online-' + user.id;
    onlineDiv.classList.add(user.online ? 'online': 'offline');
    pfpDiv.appendChild(onlineDiv);
    userInfoDiv.appendChild(pfpDiv);
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username', 'permission-level-' + user.permissionLevel, 'username-' + user.id);
    usernameSpan.innerText = user.username;
    usernameStatusDiv.appendChild(usernameSpan);
    const statusSpan = document.createElement('span');
    statusSpan.classList.add('status', 'status-' + user.id);
    statusSpan.innerText = user.status;
    usernameStatusDiv.appendChild(statusSpan);
    userInfoDiv.appendChild(usernameStatusDiv);
    boxDiv.appendChild(userInfoDiv);
    const userSettingsDiv = document.createElement('div');
    userSettingsDiv.classList.add('user-settings');
    if(user.id == cachedLogin.id) {
        userSettingsDiv.classList.add('container');
        const settingsImg = document.createElement('img');
        settingsImg.classList.add('button');
        settingsImg.src = './img/settings.svg';
        userSettingsDiv.appendChild(settingsImg);
        const createChatImg = document.createElement('img');
        createChatImg.classList.add('button');
        createChatImg.src = './img/create-chat.svg';
        userSettingsDiv.appendChild(createChatImg);
        settingsImg.addEventListener('click', () => {
            settingsImg.animate([
                {transform: 'scale(0.6)'},
                {transform: 'scale(1.4)'},
                {transform: 'scale(1)'}
            ], {duration: 250});
            window.location.href = '/settings';
        });
        createChatImg.addEventListener('click', () => {
            createChatImg.animate([
                {transform: 'scale(0.6)'},
                {transform: 'scale(1.4)'},
                {transform: 'scale(1)'}
            ], {duration: 250});
            window.location.href = '/create-chat';
        });
    }
    else {
        userSettingsDiv.classList.add('box');
        const lastOnlineSpan = document.createElement('span');
        lastOnlineSpan.id = 'last-online-' + user.id;
        lastOnlineSpan.classList.add('user-last-online');
        setReadableDate(lastOnlineSpan, user.lastOnline, 'Last online: $');
        if(user.online) lastOnlineSpan.style.display = 'none';
        userSettingsDiv.appendChild(lastOnlineSpan);
        const statusSpan = document.createElement('span');
        statusSpan.classList.add('user-status', 'status-' + user.id);
        statusSpan.innerText = user.status;
        userSettingsDiv.appendChild(statusSpan);
        const userActionsDiv = document.createElement('div');
        userActionsDiv.classList.add('container', 'user-actions');
        const atImg = document.createElement('img');
        atImg.classList.add('button');
        atImg.src = './img/at.svg';
        userActionsDiv.appendChild(atImg);
        userSettingsDiv.appendChild(userActionsDiv);
        atImg.addEventListener('click', () => {
            atImg.animate([
                {transform: 'scale(0.6)'},
                {transform: 'scale(1.4)'},
                {transform: 'scale(1)'}
            ], {duration: 250});
            let at;
            if(/\S$/.exec(messageTextarea.value) != null) at = ' @';
            else at = '@';
            messageTextarea.value += at + user.id;
        });
    }
    if(user.id != cachedLogin.id) userSettingsDiv.style.display = 'none';
    boxDiv.appendChild(userSettingsDiv);
    userDiv.appendChild(boxDiv);
    userDiv.addEventListener('click', () => {
        if(user.id == selectedUser) return;
        const selectedUserDiv = document.getElementById('user-' + selectedUser);
        if(selectedUserDiv != null) {
            selectedUserDiv.classList.remove('selected');
            for(const div of selectedUserDiv.getElementsByClassName('user-settings'))
                div.style.display = 'none';
        }
        selectedUser = user.id;
        userDiv.classList.add('selected');
        userSettingsDiv.style.display = '';
    });
    usersDiv.appendChild(userDiv);
}

function setReadableDate(element, timestamp, text) {
    const minute = 60, hour = minute * 60, day = hour * 24;
    let difference = Math.floor(Date.now() / 1000) - timestamp;
    const seconds = difference % minute;
    difference -= seconds;
    const minutes = Math.floor(difference / minute) % hour;
    difference -= minutes;
    const hours = Math.floor(difference / hour) % day;
    difference -= hours;
    const days = Math.floor(difference / day);
    if(days < 7) {
        let delay = 1000;
        let readableDate;
        if(days == 0) {
            if(hours == 0) {
                if(minutes == 0)
                    readableDate = seconds + ' second' + (seconds == 1 ? '' : 's');
                else {
                    readableDate = minutes + ' minute' + (minutes == 1 ? '' : 's');
                    delay *= minute;
                }
            }
            else {
                readableDate = hours + ' hour' + (hours == 1 ? '' : 's');
                delay *= hour;
            }
        }
        else {
            readableDate = days + ' day' + (days == 1 ? '' : 's');
            delay *= day;
        }
        readableDate += ' ago';
        element.innerText = text.replace('$', readableDate);
        if(element.timer != undefined) {
            clearInterval(element.timer);
            element.timer = undefined;
        }
        element.timer = setInterval(() => {
            setReadableDate(element, timestamp, text);
        }, delay);
    }
    else {
        if(element.timer != undefined) {
            clearInterval(element.timer);
            element.timer = undefined;
        }
        element.innerText = new Date(timestamp).toLocaleString();
    }
}

function loadChatLastMessages(selected) {
    $.ajax({
        url: '/api/chat/get-last-messages',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            chatId: selected.id,
            numberOfMessages: 16
        }),
        contentType: 'application/json',
        success: (res) => {
            messagesCacheArray = res.lastMessages;
            createMessagesCache();
            setMessages(res.lastMessages);
        },
        statusCode: statusCodeActions
    });
}

function createMessagesCache() {
    messagesCache = {};
    for(const message of messagesCacheArray)
        messagesCache[message.id] = message;
}

function setMessages(messages) {
    messagesDiv.innerHTML = '';
    for(let message of messages) {
        messagesDiv.appendChild(createMessageDiv(message));
    }
}

function addMessage(message) {
    messagesCache[message.id] = message;
    messagesCacheArray.concat(message);
    messagesCacheArray.sort((a, b) => {
        return b.id - a.id;
    });
    const i = messagesCacheArray.indexOf(message);
    const messageDiv = createMessageDiv(message);
    if(i == messagesCacheArray.length - 1)
        messagesDiv.appendChild(messageDiv);
    else
        messagesDiv.insertBefore(messageDiv, messagesDiv.childNodes[i]);
}

function parseMessage(text) {
    const expr = /@(\d{1,9})/g;
    const matches = [];
    for(let match = expr.exec(text); match != null; match = expr.exec(text))
        matches.push(match);
    for(const match of matches) {
        const userTagSpan = document.createElement('span');
        userTagSpan.classList.add('user-tag', 'user-tag-' + match[1]);
        const taggedUser = usersCache[match[1]];
        if(taggedUser == undefined) {
            $.ajax({
                url: '/api/user/info',
                method: 'POST',
                data: JSON.stringify({
                    token: cachedLogin.token,
                    id: cachedLogin.id,
                    userId: parseInt(match[1])
                }),
                contentType: 'application/json',
                success: (res) => {
                    for(const span of document.getElementsByClassName('user-tag-' + match[1])) {
                        span.classList.add('permission-level-removed');
                        span.innerText = '@' + res.username;
                    }
                },
                error: () => {
                    for(const span of document.getElementsByClassName('user-tag-' + match[1])) {
                        span.classList.add('permission-level-removed');
                        span.innerText = '@Unknown';
                    }
                }
            });
        }
        else {
            userTagSpan.classList.add('permission-level-' + taggedUser.permissionLevel);
            userTagSpan.innerText = '@' + taggedUser.username;
        }
        text = text.replace(match[0], userTagSpan.outerHTML);
    }
    return text.replaceAll('\n', '<br>');
}

function createMessageDiv(message) {
    const user = usersCache[message.userId];
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('box', 'message');
    const userDiv = document.createElement('div');
    userDiv.classList.add('container', 'message-data');
    const pfpImg = document.createElement('img');
    pfpImg.classList.add('message-pfp');
    userDiv.appendChild(pfpImg);
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('message-username', 'username-' + message.userId);
    userDiv.appendChild(usernameSpan);
    const datetimeSpan = document.createElement('span');
    datetimeSpan.classList.add('message-meta');
    setReadableDate(datetimeSpan, message.timestamp, '$');
    userDiv.appendChild(datetimeSpan);
    const editedSpan = document.createElement('span');
    editedSpan.id = 'edited-' + message.id;
    editedSpan.classList.add('message-meta');
    editedSpan.innerText = '(edited)';
    userDiv.appendChild(editedSpan);
    if(!message.edited) editedSpan.style.display = 'none';
    const messageSpan = document.createElement('span');
    messageSpan.id = 'message-' + message.id;
    messageSpan.classList.add('message-text');
    messageSpan.innerHTML = parseMessage(message.message);
    const messageActionsDiv = document.createElement('div');
    messageSpan.addEventListener('click', () => {
        if((message.userId != cachedLogin.id && usersCache[cachedLogin.id].permissionLevel > 1) || usersCache[cachedLogin.id].permissionLevel >= 3) {
            messageSpan.classList.remove('selected');
            messageActionsDiv.style.display = 'none';
            selectedMessage = undefined;
            return;
        }
        if(messageSpan.classList.contains('selected')) {
            messageSpan.classList.remove('selected');
            messageActionsDiv.style.display = 'none';
            selectedMessage = undefined;
        }
        else {
            for(const span of document.getElementsByClassName('message-text'))
            span.classList.remove('selected');
            for(const actions of document.getElementsByClassName('message-actions'))
                actions.style.display = 'none';
            messageSpan.classList.add('selected');
            messageActionsDiv.style.display = '';
            selectedMessage = message.id;
        }
    });
    messageDiv.appendChild(userDiv);
    messageDiv.appendChild(messageSpan);
    messageActionsDiv.classList.add('container', 'message-actions');
    messageActionsDiv.style.display = 'none';
    const deleteImg = document.createElement('img');
    deleteImg.src = './img/delete.svg';
    deleteImg.classList.add('button');
    if(message.userId != cachedLogin.id) deleteImg.classList.add('delete');
    messageActionsDiv.appendChild(deleteImg);
    deleteImg.addEventListener('click', () => {
        deleteImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        $.ajax({
            url: '/api/chat/delete-message',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: selectedChat,
                messageId: message.id
            }),
            contentType: 'application/json',
            success: () => {},
            statusCode: statusCodeActions
        });
    });
    if(usersCache[cachedLogin.id].permissionLevel > 1 && message.userId != cachedLogin.id)
        deleteImg.style.display = 'none';
    if(message.userId == cachedLogin.id) {
        const editImg = document.createElement('img');
        editImg.src = './img/edit.svg';
        editImg.classList.add('button');
        messageActionsDiv.appendChild(editImg);
        editImg.addEventListener('click', () => {
            editImg.animate([
                {transform: 'scale(0.6)'},
                {transform: 'scale(1.4)'},
                {transform: 'scale(1)'}
            ], {duration: 250});
            if(editingMessage == null) editingMessage = message.id;
            else editingMessage = null;
            if(editingMessage != null)
                messageTextarea.value = messagesCache[message.id].message;
            else messageTextarea.value = '';
        });
    }
    messageDiv.appendChild(messageActionsDiv);
    if(user == undefined) {
        $.ajax({
            url: '/api/user/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                userId: parseInt(message.userId)
            }),
            contentType: 'application/json',
            success: (res) => {
                pfpImg.src = './pfps/' + res.id + '.' + res.pfpType;
                usernameSpan.classList.add('permission-level-removed');
                usernameSpan.innerText = res.username;
            },
            statusCode: statusCodeActions
        });
    }
    else {
        pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
        pfpImg.classList.add('pfp-' + user.id);
        usernameSpan.classList.add('permission-level-' + usersCache[user.id].permissionLevel);
        usernameSpan.innerText = user.username;
    }
    return messageDiv;
}

showChatsImg.addEventListener('click', () => {
    showChatsImg.animate([
        {transform: 'scale(0.6)'},
        {transform: 'scale(1.4)'},
        {transform: 'scale(1)'}
    ], {duration: 250});
    if(chatsDiv.style.display != 'flex')
        chatsDiv.style.display = 'flex';
    else
        chatsDiv.style.display = 'none';
});

messageTextarea.addEventListener('keydown', onMessageTextareaUpdate);
messageTextarea.addEventListener('keyup', onMessageTextareaUpdate);
function onMessageTextareaUpdate(e) {
    const expr = /^\s*(.*\S)\s*$/gm;
    let message = '';
    for(let match = expr.exec(messageTextarea.value); match != null; match = expr.exec(messageTextarea.value))
        message += match[1] + '\n';
    message = message.replace('\n', '');
    const chars = new Blob([message]).size;
    if(chars > 2048) messageCharsSpan.classList.add('error');
    else messageCharsSpan.classList.remove('error');
    messageCharsSpan.innerText = chars;
    let lines = messageTextarea.value.split('\n').length;
    if(lines > 6) lines = 6;
    else if(lines < 2) lines = 2;
    messageTextarea.rows = lines;
    if(e != null) {
        if(e.keyCode == 13 && !e.shiftKey) {
            if(e.type == 'keydown')
                sendMessage();
            else
                messageTextarea.value = '';
        }
    }
}

sendImg.addEventListener('click', sendMessage);

function sendMessage() {
    const expr = /^\s*(.*\S)\s*$/gm;
    let message = '';
    for(let match = expr.exec(messageTextarea.value); match != null; match = expr.exec(messageTextarea.value))
        message += match[1] + '\n';
    message = message.replace('\n', '');
    const chars = new Blob([message]).size;
    if(chars > 2048 || chars == 0) return;
    messageTextarea.value = '';
    sendImg.animate([
        {transform: 'rotate(0deg)', offset: 0},
        {transform: 'rotate(-90deg)', offset: 0.2},
        {transform: 'translate(0, -10px) rotate(-90deg)', offset: 0.3},
        {transform: 'translate(0, -10px) rotate(-270deg)', offset: 0.6},
        {transform: 'translate(0, 0) rotate(-270deg)', offset: 0.9},
        {transform: 'rotate(0deg)', offset: 1}
    ], {duration: 700});
    if(editingMessage == null) {
        $.ajax({
            url: '/api/chat/send-message',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: chatsCache[selectedChat].id,
                message: message
            }),
            contentType: 'application/json',
            success: () => {},
            statusCode: statusCodeActions
        });
    }
    else {
        $.ajax({
            url: '/api/chat/edit-message',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: chatsCache[selectedChat].id,
                messageId: editingMessage,
                message: message
            }),
            contentType: 'application/json',
            success: () => {},
            statusCode: statusCodeActions
        });
        document.getElementById('message-' + editingMessage).click();
        editingMessage = null;
    }
}

emojiImg.addEventListener('click', () => {
    emojiImg.animate([
        {transform: 'scale(0.6)'},
        {transform: 'scale(1.4)'},
        {transform: 'scale(1)'}
    ], {duration: 250});
    if(emojiSelectorDiv.style.display == 'none')
        emojiSelectorDiv.style.display = '';
    else
        emojiSelectorDiv.style.display = 'none';
});

window.addEventListener('resize', () => {
    let temp = chatNameSpan.style.animation;
    chatNameSpan.style.display = 'none';
    chatNameSpan.style.animation = 'none';
    chatNameSpan.offsetHeight;
    chatNameSpan.style.animation = temp;
    chatNameSpan.style.display = '';
    chatDescriptionSpan.style.display = 'none';
    temp = chatDescriptionSpan.style.animation;
    chatDescriptionSpan.style.animation = 'none';
    chatDescriptionSpan.offsetHeight;
    chatDescriptionSpan.style.animation = temp;
    chatDescriptionSpan.style.display = '';
    reloadAnimations();
});
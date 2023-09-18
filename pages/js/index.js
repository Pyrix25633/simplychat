import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";
import { emojis } from "./emoji.js";

enableLoadingDiv();

const chatsDiv = document.getElementById('chats');
const usersDiv = document.getElementById('users');
const chatLogoImg = document.getElementById('chat-logo');
const chatNameSpan = document.getElementById('chat-name');
const chatDescriptionSpan = document.getElementById('chat-description');
const messagesDiv = document.getElementById('messages');
const textareaDiv = document.getElementById('textarea');
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
let messagesCache = [];
let selectedChat;
let usersCache;
let selectedUser;

const socket = io();
socket.on('connect', () => {
    socket.emit('connect-user', cachedLogin);
});
socket.on('message-new', (data) => {
    if(data.chatId == chatsCache[selectedChat].id) {
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
            success: addMessage,
            statusCode: statusCodeActions
        });
    }
});
socket.on('user-online', (data) => {
    const lastOnlineSpan = document.getElementById('last-online-' + data.id);
    const onlineDiv = document.getElementById('online-' + data.id);
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
            for(const status of document.getElementsByClassName('status-' + data.id))
                status.innerText = res.status;
        },
        statusCode: statusCodeActions
    });
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
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerText = 'Loading...';
    document.body.appendChild(loadingDiv);
}

function disableLoadingDiv() {
    reloadAnimations();
    document.body.removeChild(document.getElementById('loading'));
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
                        const t = b.lastMessageTimestamp - a.lastMessageTimestamp;
                        if(t == 0)
                            return b.users.length - a.users.length;
                        return t;
                    });
                    chatsDiv.innerHTML = '';
                    selectedChat = Object.keys(chatsCacheArray)[0];
                    for(const chat of chatsCacheArray) {
                        setChatInfo(chat, chat.id == selectedChat);
                    }
                    setChatTopbar(chatsCacheArray[0]);
                    loadChatUsers(chatsCacheArray[0], loadChatLastMessages);
                }
            },
            statusCode: statusCodeActions
        });
    }
}

function setChatInfo(chat, selected) {
    const chatDiv = document.createElement('div');
    chatDiv.classList.add('container', 'chat');
    if(selected) chatDiv.classList.add('selected');
    const boxDiv = document.createElement('div');
    boxDiv.classList.add('box');
    const chatInfoDiv = document.createElement('div');
    chatInfoDiv.classList.add('container');
    const nameDescriptionDiv = document.createElement('div');
    nameDescriptionDiv.classList.add('box', 'marquee');
    const chatLogoDiv = document.createElement('div');
    chatLogoDiv.classList.add('chat-logo');
    const chatLogoImg = document.createElement('img');
    chatLogoImg.classList.add('chat-logo');
    chatLogoImg.src = './chatLogos/' + chat.id + '.' + chat.chatLogoType;
    chatLogoDiv.appendChild(chatLogoImg);
    chatInfoDiv.appendChild(chatLogoDiv);
    const chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('chat-name');
    chatNameSpan.innerText = chat.name;
    nameDescriptionDiv.appendChild(chatNameSpan);
    const chatDescriptionSpan = document.createElement('span');
    chatDescriptionSpan.classList.add('chat-description');
    chatDescriptionSpan.innerText = chat.description;
    nameDescriptionDiv.appendChild(chatDescriptionSpan);
    chatInfoDiv.appendChild(nameDescriptionDiv);
    boxDiv.appendChild(chatInfoDiv);
    const chatSettingsDiv = document.createElement('div');
    chatSettingsDiv.classList.add('container', 'chat-settings');
    if(chat.users[cachedLogin.id.toString()].permissionLevel == 0) {
        const settingsImg = document.createElement('img');
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
    }
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
    if(!selected) chatSettingsDiv.style.display = 'none';
    boxDiv.appendChild(chatSettingsDiv);
    chatDiv.appendChild(boxDiv);
    chatDiv.addEventListener('click', () => {
        if(chat.id == selectedChat) return;
        enableLoadingDiv();
        for(let div of chatsDiv.getElementsByClassName('chat'))
            div.classList.remove('selected');
        for(let div of chatsDiv.getElementsByClassName('chat-settings'))
            div.style.display = 'none';
        selectedChat = chat.id;
        chatDiv.classList.add('selected');
        chatSettingsDiv.style.display = '';
        setChatTopbar(chat);
        loadChatUsers(chat, loadChatLastMessages);
        if(chat.users[cachedLogin.id.toString()] > 2)
            textareaDiv.style.display = 'none';
        else
            textareaDiv.style.display = '';
    });
    chatsDiv.appendChild(chatDiv);
}

function setChatTopbar(selected) {
    chatLogoImg.src = '/chatLogos/' + selected.id + '.' + selected.chatLogoType;
    chatNameSpan.innerText = selected.name;
    chatDescriptionSpan.innerText = selected.description;
}

function loadChatUsers(selected, callback) {
    usersCache = {};
    selectedUser = cachedLogin.id;
    let usersCacheArray = [];
    usersDiv.innerHTML = '';
    const ids = Object.keys(selected.users);
    for(let id of ids) {
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
                user.id = id;
                user.permissionLevel = selected.users[id].permissionLevel;
                usersCacheArray.push(user);
                if(usersCacheArray.length == ids.length) {
                    usersCacheArray.sort((a, b) => {
                        if(a.id == cachedLogin.id) return -1;
                        if(b.id == cachedLogin.id) return 1;
                        const p = a.permissionLevel - b.permissionLevel;
                        if(p == 0)
                            return b.lastOnline - a.lastOnline;
                        return p;
                    });
                    for(let user of usersCacheArray) {
                        setChatUser(user, user.id == cachedLogin.id);
                        usersCache[user.id.toString()] = user;
                    }
                    callback(selected);
                    disableLoadingDiv();
                }
            },
            statusCode: statusCodeActions
        });
    }
}

function setChatUser(user, selected) {
    const userDiv = document.createElement('div');
    userDiv.classList.add('container', 'user');
    if(selected) userDiv.classList.add('selected');
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
    if(user.id == cachedLogin.id) {
        userSettingsDiv.classList.add('container', 'user-settings');
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
        statusSpan.id = 'status-' + user.id;
        statusSpan.classList.add('user-status', 'status-' + user.id);
        statusSpan.innerText = user.status;
        userSettingsDiv.appendChild(statusSpan);
    }
    if(!selected) userSettingsDiv.style.display = 'none';
    boxDiv.appendChild(userSettingsDiv);
    userDiv.appendChild(boxDiv);
    userDiv.addEventListener('click', () => {
        if(user.id == selectedUser) return;
        for(let div of usersDiv.getElementsByClassName('user'))
            div.classList.remove('selected');
        for(let div of usersDiv.getElementsByClassName('user-settings'))
            div.style.display = 'none';
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
            numberOfMessages: 10
        }),
        contentType: 'application/json',
        success: (res) => {
            messagesCache = res.lastMessages;
            setMessages(res.lastMessages);
        },
        statusCode: statusCodeActions
    });
}

function setMessages(messages) {
    messagesDiv.innerHTML = '';
    for(let message of messages) {
        messagesDiv.appendChild(createMessageDiv(message));
    }
}

function addMessage(message) {
    messagesCache.concat(message);
    messagesCache.sort((a, b) => {
        return b.id - a.id;
    });
    const i = messagesCache.indexOf(message);
    const messageDiv = createMessageDiv(message);
    if(i == messagesCache.length - 1)
        messagesDiv.appendChild(messageDiv);
    else
        messagesDiv.insertBefore(messageDiv, messagesDiv.childNodes[i]);
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
    usernameSpan.classList.add('message-username');
    userDiv.appendChild(usernameSpan);
    const datetimeSpan = document.createElement('span');
    datetimeSpan.classList.add('message-meta');
    setReadableDate(datetimeSpan, message.timestamp, '$');
    userDiv.appendChild(datetimeSpan);
    if(message.edited) {
        const editedSpan = document.createElement('span');
        editedSpan.classList.add('message-meta');
        editedSpan.innerText = '(edited)';
        userDiv.appendChild(editedSpan);
    }
    const messageSpan = document.createElement('span');
    messageSpan.classList.add('message-text');
    messageSpan.innerText = message.message;
    messageDiv.appendChild(userDiv);
    messageDiv.appendChild(messageSpan);
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
        usernameSpan.classList.add('username-' + user.id,
            'permission-level-' + chatsCache[selectedChat].users[user.id.toString()].permissionLevel);
        usernameSpan.innerText = user.username;
    }
    return messageDiv;
}

messageTextarea.addEventListener('keydown', onMessageTextareaUpdate);
messageTextarea.addEventListener('keyup', onMessageTextareaUpdate);
function onMessageTextareaUpdate(e) {
    const capture = /^\s*(.*\S)\s*$/.exec(messageTextarea.value);
    const message = capture == null ? '' : capture[1];
    const chars = new Blob([message]).size;
    if(chars > 2048) messageCharsSpan.classList.add('error');
    else messageCharsSpan.classList.remove('error');
    messageCharsSpan.innerText = chars;
    let lines = message.split('\n').length;
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
    const capture = /^\s*(.*\S)\s*$/.exec(messageTextarea.value);
    const message = capture == null ? '' : capture[1];
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
        success: (res) => {
            
        },
        statusCode: statusCodeActions
    });
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
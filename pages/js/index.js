import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";
import { emojis } from "./emoji.js";

enableLoadingDiv();

const chatsDiv = document.getElementById('chats');
const usersDiv = document.getElementById('users');
const chatLogoImg = document.getElementById('chat-logo');
const chatNameSpan = document.getElementById('chat-name');
const chatDescriptionSpan = document.getElementById('chat-description');
const messagesDiv = document.getElementById('messages');
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
const chatsCache = [];
let messagesCache = [];
let selectedChat = 0;
let usersCache;

const socket = io();
socket.on('connect', () => {
    socket.emit('connect-user', cachedLogin);
});
socket.on('new-message', (data) => {
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
    const animations = document.getAnimations();
    for(let animation of animations)
        animation.cancel();
    for(let animation of animations)
        animation.play();
    document.body.removeChild(document.getElementById('loading'));
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
                chatsCache.push(res);
                if(chatsCache.length == chats.length)
                    loadChatsLastMessage();
            },
            statusCode: statusCodeActions
        });
    }
}

function loadChatsLastMessage() {
    let numOfReceivedResponses = 0;
    for(let i = 0; i < chatsCache.length; i++) {
        const chat = chatsCache[i];
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
                if(numOfReceivedResponses == chatsCache.length) {
                    chatsCache.sort((a, b) => {
                        const t = b.lastMessageTimestamp - a.lastMessageTimestamp;
                        if(t == 0)
                            return b.users.length - a.users.length;
                        return t;
                    });
                    chatsDiv.innerHTML = '';
                    for(let i = 0; i < chatsCache.length; i++) {
                        const chat = chatsCache[i];
                        setChatInfo(chat, i, i == 0);
                    }
                    setChatTopbar(chatsCache[0]);
                    loadChatUsers(chatsCache[0], loadChatLastMessages);
                }
            },
            statusCode: statusCodeActions
        });
    }
}

function setChatInfo(chat, i, selected) {
    const chatDiv = document.createElement('div');
    chatDiv.classList.add('container', 'chat');
    if(selected) chatDiv.classList.add('selected');
    const nameDescriptionDiv = document.createElement('div');
    nameDescriptionDiv.classList.add('box', 'marquee');
    const chatLogoDiv = document.createElement('div');
    chatLogoDiv.classList.add('chat-logo');
    const chatLogoImg = document.createElement('img');
    chatLogoImg.classList.add('chat-logo');
    chatLogoImg.src = './chatLogos/' + chat.id + '.' + chat.chatLogoType;
    chatLogoDiv.appendChild(chatLogoImg);
    chatDiv.appendChild(chatLogoDiv);
    const chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('chat-name');
    chatNameSpan.innerText = chat.name;
    nameDescriptionDiv.appendChild(chatNameSpan);
    const chatDescriptionSpan = document.createElement('span');
    chatDescriptionSpan.classList.add('chat-description');
    chatDescriptionSpan.innerText = chat.description;
    nameDescriptionDiv.appendChild(chatDescriptionSpan);
    chatDiv.appendChild(nameDescriptionDiv);
    chatDiv.addEventListener('click', () => {
        if(i == selectedChat) return;
        enableLoadingDiv();
        for(let div of chatsDiv.getElementsByClassName('chat'))
            div.classList.remove('selected');
        selectedChat = i;
        chatDiv.classList.add('selected');
        setChatTopbar(chatsCache[i]);
        loadChatUsers(chatsCache[i], loadChatLastMessages);
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
    const usernameStatusDiv = document.createElement('div');
    usernameStatusDiv.classList.add('box', 'marquee');
    const pfpDiv = document.createElement('div');
    pfpDiv.classList.add('pfp');
    const pfpImg = document.createElement('img');
    pfpImg.classList.add('pfp');
    pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
    pfpDiv.appendChild(pfpImg);
    const onlineDiv = document.createElement('div');
    console.log(user);
    onlineDiv.classList.add(user.online ? 'online': 'offline');
    pfpDiv.appendChild(onlineDiv);
    userDiv.appendChild(pfpDiv);
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.classList.add('permission-level-' + user.permissionLevel);
    usernameSpan.innerText = user.username;
    usernameStatusDiv.appendChild(usernameSpan);
    const statusSpan = document.createElement('span');
    statusSpan.classList.add('status');
    statusSpan.innerText = user.status;
    usernameStatusDiv.appendChild(statusSpan);
    userDiv.appendChild(usernameStatusDiv);
    usersDiv.appendChild(userDiv);
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
    pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
    userDiv.appendChild(pfpImg);
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('message-username',
        'permission-level-' + chatsCache[selectedChat].users[user.id.toString()].permissionLevel);
    usernameSpan.innerText = user.username;
    userDiv.appendChild(usernameSpan);
    const datetimeSpan = document.createElement('span');
    datetimeSpan.classList.add('message-meta');
    datetimeSpan.innerText = new Date(message.timestamp * 1000).toLocaleString();
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
    return messageDiv;
}

messageTextarea.addEventListener('keydown', onMessageTextareaUpdate);
messageTextarea.addEventListener('keyup', onMessageTextareaUpdate);
function onMessageTextareaUpdate(e) {
    const capture = /^\s*(.+\S)\s*$/.exec(messageTextarea.value);
    const message = capture == null ? '' : capture[1];
    const chars = new Blob([message]).size;
    if(chars > 2048) messageCharsSpan.classList.add('error');
    else messageCharsSpan.classList.remove('error');
    messageCharsSpan.innerText = chars;
    let lines = message.split('\n').length;
    if(lines > 6) lines = 6;
    else if(lines < 2) lines = 2;
    messageTextarea.rows = lines;
    if(e != null)
        console.log(e.keyCode == 13 && e.shiftKey && e.type == 'keydown', e);
}

sendImg.addEventListener('click', () => {
    const capture = /^\s*(.+\S)\s*$/.exec(messageTextarea.value);
    const message = capture == null ? '' : capture[1];
    const chars = new Blob([message]).size;
    if(chars > 2048 || chars == 0) return;
    messageTextarea.value = '';
    sendImg.animate([
        {transform: 'rotate(0deg)'},
        {transform: 'rotate(-90deg)'},
        {transform: 'translate(0, -10px) rotate(-90deg)'}
    ], {duration: 250});
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
});

emojiImg.addEventListener('click', () => {
    if(emojiSelectorDiv.style.display == 'none')
        emojiSelectorDiv.style.display = '';
    else
        emojiSelectorDiv.style.display = 'none';
});
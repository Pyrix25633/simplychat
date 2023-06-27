import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";

const chatsDiv = document.getElementById('chats');
const usersDiv = document.getElementById('users');
const chatLogoImg = document.getElementById('chat-logo');
const chatNameSpan = document.getElementById('chat-name');
const chatDescriptionSpan = document.getElementById('chat-description');
const chatsCache = [];
let usersCache;

loadSettings(() => {
    $.ajax({
        url: '/api/chat/list',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: (res) => {
            enableLoadingDiv();
            const chats = Object.keys(res.chats);
            if(chats.length > 0)
                loadChatsInfo(chats, res.chats);
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
                    loadChatUsers(chatsCache[0]);
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
    const chatLogoImg = document.createElement('img');
    chatLogoImg.classList.add('chat-logo');
    chatLogoImg.src = './chatLogos/' + chat.id + '.' + chat.chatLogoType;
    const chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('chat-name');
    chatNameSpan.innerText = chat.name;
    const chatDescriptionSpan = document.createElement('span');
    chatDescriptionSpan.classList.add('chat-description');
    chatDescriptionSpan.innerText = chat.description;
    nameDescriptionDiv.appendChild(chatNameSpan);
    nameDescriptionDiv.appendChild(chatDescriptionSpan);
    chatDiv.appendChild(chatLogoImg);
    chatDiv.appendChild(nameDescriptionDiv);
    chatDiv.addEventListener('click', () => {
        enableLoadingDiv();
        for(let div of chatsDiv.getElementsByClassName('chat'))
            div.classList.remove('selected');
        chatDiv.classList.add('selected');
        setChatTopbar(chatsCache[i]);
        loadChatUsers(chatsCache[i]);
    });
    chatsDiv.appendChild(chatDiv);
}

function setChatTopbar(selected) {
    chatLogoImg.src = '/chatLogos/' + selected.id + '.' + selected.chatLogoType;
    chatNameSpan.innerText = selected.name;
    chatDescriptionSpan.innerText = selected.description;
}

function loadChatUsers(selected) {
    usersCache = [];
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
                usersCache.push(user);
                if(usersCache.length == ids.length) {
                    usersCache.sort((a, b) => {
                        const p = a.permissionLevel - b.permissionLevel;
                        if(p == 0)
                            return b.lastOnline - a.lastOnline;
                        return p;
                    });
                    for(let user of usersCache)
                        setChatUser(user, user.id == cachedLogin.id);
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
    const pfpImg = document.createElement('img');
    pfpImg.classList.add('pfp');
    pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username');
    usernameSpan.classList.add('permission-level-' + user.permissionLevel);
    usernameSpan.innerText = user.username;
    const statusSpan = document.createElement('span');
    statusSpan.classList.add('status');
    statusSpan.innerText = user.status;
    usernameStatusDiv.appendChild(usernameSpan);
    usernameStatusDiv.appendChild(statusSpan);
    userDiv.appendChild(pfpImg);
    userDiv.appendChild(usernameStatusDiv);
    usersDiv.appendChild(userDiv);
}
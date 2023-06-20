import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";

const chatsDiv = document.getElementById('chats');

loadSettings(() => {
    $.ajax({
        url: '/api/chat/list',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: (res) => {
            loadChatsInfo(res.chats);
        },
        statusCode: statusCodeActions
    });
});

function loadChatsInfo(chats) {
    for(let chat of chats) {
        $.ajax({
            url: '/api/chat/info',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: chat.id
            }),
            contentType: 'application/json',
            success: (res) => {
                setChatInfo(chat.id, res);
            },
            statusCode: statusCodeActions
        });
    }
}

function setChatInfo(id, res) {
    const chatDiv = document.createElement('div');
    chatDiv.classList.add('container', 'chat');
    const nameDescriptionDiv = document.createElement('div');
    nameDescriptionDiv.classList.add('box', 'marquee');
    const chatLogoImg = document.createElement('img');
    chatLogoImg.classList.add('chat-logo');
    chatLogoImg.src = './chatLogos/' + id + '.' + res.chatLogoType;
    const chatNameSpan = document.createElement('span');
    chatNameSpan.classList.add('chat-name');
    chatNameSpan.innerHTML = res.name;
    const chatDescriptionSpan = document.createElement('span');
    chatDescriptionSpan.classList.add('chat-description');
    chatDescriptionSpan.innerHTML = res.description;
    nameDescriptionDiv.appendChild(chatNameSpan);
    nameDescriptionDiv.appendChild(chatDescriptionSpan);
    chatDiv.appendChild(chatLogoImg);
    chatDiv.appendChild(nameDescriptionDiv);
    chatsDiv.appendChild(chatDiv);
}
import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";

const chatsDiv = document.getElementById('chats');
const chats = [];

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
    for(let chatId of Object.keys(chats)) {
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
                setChatInfo(chatId, res);
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
    console.log(id, res);
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
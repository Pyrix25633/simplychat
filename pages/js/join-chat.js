import { cachedLogin, loadSettings, statusCodeActions } from "./load-settings.js";

const chatLogoImg = document.getElementById('chat-logo');
const nameH3 = document.getElementById('name');
const descriptionSpan = document.getElementById('description');
const usersSpan = document.getElementById('users');
const joinButton = document.getElementById('join');

const params = new URLSearchParams(window.location.search);
const chatId = parseInt(params.get('id'));
const chatToken = params.get('token');

loadSettings(() => {
    $.ajax({
        url: '/api/chat/join-info',
        method: 'POST',
        data: JSON.stringify({
            id: cachedLogin.id,
            token: cachedLogin.token,
            chatId: chatId,
            chatToken: chatToken
        }),
        contentType: 'application/json',
        success: showChatInfo,
        statusCode: statusCodeActions
    });
});

function showChatInfo(res) {
    chatLogoImg.src = './chatLogos/' + chatId + '.' + res.chatLogoType;
    nameH3.innerText = res.name;
    descriptionSpan.innerText = res.description;
    usersSpan.innerText = res.users + ' User' + (res.users == 1 ? '' : 's');
}

function waitAndRefresh() {
    setInterval(() => {
        window.location.href = '/';
    }, 250);
}

joinButton.addEventListener('click', () => {
    $.ajax({
        url: '/api/chat/join',
        method: 'POST',
        data: JSON.stringify({
            id: cachedLogin.id,
            token: cachedLogin.token,
            chatId: chatId,
            chatToken: chatToken
        }),
        contentType: 'application/json',
        success: waitAndRefresh,
        statusCode: waitAndRefresh
    });
});
import { loadSettings, cachedLogin, statusCodeActions } from "./load-settings.js";

const chatLogoImage = document.getElementById('chat-logo');
const changeChatLogoImage = document.getElementById('change-chat-logo');
const newChatLogoInput = document.getElementById('new-chat-logo');
const chatLogoFeedbackSpan = document.getElementById('chat-logo-feedback');

const idSpan = document.getElementById('id');
const nameInput = document.getElementById('name');
const nameFeedbackSpan = document.getElementById('name-feedback');
const descriptionInput = document.getElementById('description');
const descriptionFeedbackSpan = document.getElementById('description-feedback');

const copyLinkButton = document.getElementById('copy-link');
const regenerateTokenButton = document.getElementById('regenerate-token');
const tokenExpirationInput = document.getElementById('token-expiration');
const tokenExpirationFeedbackSpan = document.getElementById('token-expiration-feedback');

const usersDiv = document.getElementById('users');

const cancelButton = document.getElementById('cancel');
const saveButton = document.getElementById('save');

const oneDayTimestamp = 60 * 60 * 24;

const chatId = parseInt(new URLSearchParams(window.location.search).get('id'));

let settings;
let validName = true;
let validDescription = true;
let validTokenExpiration = true;
saveButton.disabled = true;

loadSettings(() => {
    $.ajax({
        url: '/api/chat/get-settings',
        method: 'POST',
        data: JSON.stringify({
            id: cachedLogin.id,
            token: cachedLogin.token,
            chatId: chatId
        }),
        contentType: 'application/json',
        success: showChatSettings,
        statusCode: statusCodeActions
    });
});

function showChatSettings(res) {
    settings = res;
    idSpan.innerText = res.id;
    chatLogoImage.src = './chatLogos/' + res.id + '.' + res.chatLogoType;
    nameInput.value = res.name;
    descriptionInput.value = res.description;
    if(res.tokenExpiration == null)
        tokenExpirationInput.value = 'Never';
    else
        tokenExpirationInput.value = new Date(res.tokenExpiration * 1000).toLocaleDateString("en-GB");
    settings.removedUsers = [];
    settings.modifiedUsers = {};
    const ids = Object.keys(res.users);
    const usersCacheArray = [];
    for(let id of ids) {
        if(id == cachedLogin.id) continue;
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
                user.permissionLevel = settings.users[id].permissionLevel;
                usersCacheArray.push(user);
                if(usersCacheArray.length == ids.length - 1) {
                    usersCacheArray.sort((a, b) => {
                        return a.username.localeCompare(b.username);
                    });
                    usersDiv.innerHTML = '';
                    for(let user of usersCacheArray)
                        setUser(user);
                }
            },
            statusCode: statusCodeActions
        });
    }
}

function setUser(user) {
    const userDiv = document.createElement('div');
    userDiv.classList.add('container', 'user');
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('container');
    const userInfoDiv = document.createElement('div');
    userInfoDiv.classList.add('container');
    const pfpImg = document.createElement('img');
    pfpImg.classList.add('pfp');
    pfpImg.src = './pfps/' + user.id + '.' + user.pfpType;
    userInfoDiv.appendChild(pfpImg);
    const usernameSpan = document.createElement('span');
    usernameSpan.classList.add('username', 'permission-level-' + user.permissionLevel);
    usernameSpan.innerText = user.username;
    userInfoDiv.appendChild(usernameSpan);
    containerDiv.appendChild(userInfoDiv);
    const userOptionsDiv = document.createElement('div');
    userOptionsDiv.classList.add('container', 'user-options');
    const removeImg = document.createElement('img');
    removeImg.classList.add('button');
    removeImg.src = './img/remove.svg';
    userOptionsDiv.appendChild(removeImg);
    removeImg.addEventListener('click', () => {
        usersDiv.removeChild(userDiv);
        settings.removedUsers.push(user.id);
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
    });
    const increaseImg = document.createElement('img');
    increaseImg.classList.add('button');
    increaseImg.src = './img/increase.svg';
    userOptionsDiv.appendChild(increaseImg);
    increaseImg.addEventListener('click', () => {
        increaseImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        usernameSpan.classList.replace('permission-level-' + user.permissionLevel, 'permission-level-' + (user.permissionLevel - 1));
        user.permissionLevel -= 1;
        if(user.permissionLevel == 0) increaseImg.style.display = 'none';
        else decreaseImg.style.display = '';
        settings.modifiedUsers[user.id.toString()] = {permissionLevel: user.permissionLevel};
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
    });
    if(user.permissionLevel == 0) increaseImg.style.display = 'none';
    const decreaseImg = document.createElement('img');
    decreaseImg.classList.add('button');
    decreaseImg.src = './img/decrease.svg';
    userOptionsDiv.appendChild(decreaseImg);
    decreaseImg.addEventListener('click', () => {
        decreaseImg.animate([
            {transform: 'scale(0.6)'},
            {transform: 'scale(1.4)'},
            {transform: 'scale(1)'}
        ], {duration: 250});
        usernameSpan.classList.replace('permission-level-' + user.permissionLevel, 'permission-level-' + (user.permissionLevel + 1));
        user.permissionLevel += 1;
        if(user.permissionLevel >= 3) decreaseImg.style.display = 'none';
        else increaseImg.style.display = '';
        settings.modifiedUsers[user.id.toString()] = {permissionLevel: user.permissionLevel};
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
    });
    if(user.permissionLevel >= 3) decreaseImg.style.display = 'none';
    containerDiv.appendChild(userOptionsDiv);
    userDiv.appendChild(containerDiv);
    usersDiv.appendChild(userDiv);
}

changeChatLogoImage.addEventListener('click', () => {
    var evt = document.createEvent("MouseEvents");
    evt.initEvent("click", true, false);
    newChatLogoInput.dispatchEvent(evt);
});

newChatLogoInput.addEventListener('change', () => {
    chatLogoFeedbackSpan.classList.add('error');
    function invalidType() {
        chatLogoFeedbackSpan.innerText = 'Chat Logo type must be SVG, PNG, JPG, JPEG or GIF!';
        chatLogoFeedbackSpan.classList.replace('success', 'error');
    }
    const image = new Image();
    image.onload = () => {
        const match = /^data:image\/(?:(?:(\S+)\+\S+)|(\S+));base64,(\S*)$/.exec(image.src);
        if(!(match[1] == 'svg' || match[2] == 'png' || match[2] == 'jpeg' || match[2] == 'gif')) {
            invalidType();
            return;
        }
        if(image.width == image.height) {
            if(image.width >= 512 && image.width <= 2048) {
                chatLogoFeedbackSpan.innerText = 'Valid Chat Logo';
                chatLogoFeedbackSpan.classList.replace('error', 'success');
                chatLogoImage.src = image.src;
                saveButton.disabled = !(validName && validDescription && validTokenExpiration);
                settings.chatLogo = chatLogoImage.src;
            }
            else {
                chatLogoFeedbackSpan.innerText = 'Chat Logo resolution must be between 512x512 and 2048x2048!';
                chatLogoFeedbackSpan.classList.replace('success', 'error');
            }
        } else {
            chatLogoFeedbackSpan.innerText = 'Chat Logo type must be a square!';
            chatLogoFeedbackSpan.classList.replace('success', 'error');
        }
    };
    image.onerror = invalidType;
    const reader = new FileReader();
    reader.onload = (e) => {
        image.src = e.target.result;
    };
    reader.readAsDataURL(newChatLogoInput.files[0]);
});

let nameTimer;
nameInput.addEventListener('keyup', () => {
    clearTimeout(nameTimer);
    nameTimer = setTimeout(nameTyped, 1000);
});
nameInput.addEventListener('keydown', () => {
    clearTimeout(nameTimer);
});
nameInput.addEventListener('focusout', () => {
    clearTimeout(nameTimer);
    nameTyped();
});
function nameTyped() {
    nameFeedbackSpan.classList.add('error');
    const name = nameInput.value;
    if(name.length < 3) {
        nameFeedbackSpan.classList.replace('success', 'error');
        nameFeedbackSpan.innerText = 'Name too short!';
        validName = false;
        saveButton.disabled = true;
    } else if(name.length > 64) {
        nameFeedbackSpan.classList.replace('success', 'error');
        nameFeedbackSpan.innerText = 'Name too long!';
        validName = false;
        saveButton.disabled = true;
    } else {
        for(let i = 0; i < name.length; i++) {
            const c = name.codePointAt(i);
            if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
                nameFeedbackSpan.classList.replace('success', 'error');
                nameFeedbackSpan.innerText = 'Name contains forbidden character!';
                validName = false;
                saveButton.disabled = true;
                return;
            }
        }
        nameFeedbackSpan.classList.replace('error', 'success');
        nameFeedbackSpan.innerText = 'Valid Name';
        validName = true;
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
        return;
    }
}

let descriptionTimer;
descriptionInput.addEventListener('keyup', () => {
    clearTimeout(descriptionTimer);
    descriptionTimer = setTimeout(descriptionTyped, 1000);
});
descriptionInput.addEventListener('keydown', () => {
    clearTimeout(descriptionTimer);
});
descriptionInput.addEventListener('focusout', () => {
    clearTimeout(descriptionTimer);
    descriptionTyped();
});
function descriptionTyped() {
    descriptionFeedbackSpan.classList.add('error');
    const description = descriptionInput.value;
    if(description.length < 3) {
        descriptionFeedbackSpan.classList.replace('success', 'error');
        descriptionFeedbackSpan.innerText = 'Description too short!';
        validDescription = false;
        saveButton.disabled = true;
    } else if(description.length > 128) {
        descriptionFeedbackSpan.classList.replace('success', 'error');
        descriptionFeedbackSpan.innerText = 'Description too long!';
        validDescription = false;
        saveButton.disabled = true;
    } else {
        descriptionFeedbackSpan.classList.replace('error', 'success');
        descriptionFeedbackSpan.innerText = 'Valid Description';
        validDescription = true;
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
        return;
    }
}

copyLinkButton.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.host + '/join-chat?id=' + settings.id + '&token=' + settings.token);
});

regenerateTokenButton.addEventListener('click', () => {
    saveButton.disabled = true;
    $.ajax({
        url: '/api/chat/generate-token',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            chatId: chatId
        }),
        contentType: 'application/json',
        success: (res) => {
            settings.token = res.token;
            saveButton.disabled = !(validName && validDescription && validTokenExpiration);
        },
        statusCode: statusCodeActions
    });
});

let tokenExpirationTimer;
tokenExpirationInput.addEventListener('keyup', () => {
    clearTimeout(tokenExpirationTimer);
    tokenExpirationTimer = setTimeout(tokenExpirationTyped, 1000);
});
tokenExpirationInput.addEventListener('keydown', () => {
    clearTimeout(tokenExpirationTimer);
});
tokenExpirationInput.addEventListener('focusout', () => {
    clearTimeout(tokenExpirationTimer);
    tokenExpirationTyped();
});
function tokenExpirationTyped() {
    tokenExpirationFeedbackSpan.classList.add('error');
    const match = /^(?:(\d{1,2})\/(\d{1,2})\/(\d{4}))|([Nn]ever)$/.exec(tokenExpirationInput.value);
    function invalidLinkExpiration() {
        tokenExpirationFeedbackSpan.classList.replace('success', 'error');
        tokenExpirationFeedbackSpan.innerText = 'Invalid Invite Link Expiration!';
        validTokenExpiration = false;
        saveButton.disabled = true;
    }
    function validLinkExpiration() {
        tokenExpirationFeedbackSpan.classList.replace('error', 'success');
        tokenExpirationFeedbackSpan.innerText = 'Valid Invite Link Expiration';
        validTokenExpiration = true;
        saveButton.disabled = !(validName && validDescription && validTokenExpiration);
    }
    if(match == null) invalidLinkExpiration();
    else {
        if(match[4] == undefined) {
            settings.tokenExpiration = Math.floor(Date.parse(match[2] + '/' + match[1] + '/' + match[3]) / 1000);
            if(settings.tokenExpiration < Math.floor(Date.now() / 1000)) invalidLinkExpiration();
            else validLinkExpiration();
        }
        else {
            settings.tokenExpiration = null;
            validLinkExpiration();
        }
    }
}

cancelButton.addEventListener('click', () => {
    window.location.href = '/';
});

function waitAndRefresh() {
    setInterval(() => {
        window.location.href = '/';
    }, 250);
}

saveButton.addEventListener('click', async () => {
    if(!(validName && validDescription && validTokenExpiration)) return;
    $.ajax({
        url: '/api/chat/set-settings',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            chatId: settings.id,
            name: nameInput.value,
            description: descriptionInput.value,
            chatToken: settings.token,
            tokenExpiration: settings.tokenExpiration,
            removedUsers: settings.removedUsers,
            modifiedUsers: settings.modifiedUsers
        }),
        contentType: 'application/json',
        success: waitAndRefresh,
        error: waitAndRefresh
    });
    if(settings.chatLogo != undefined) {
        $.ajax({
            url: '/api/chat/set-chat-logo',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                chatId: settings.id,
                chatLogo: settings.chatLogo
            }),
            contentType: 'application/json',
            success: waitAndRefresh,
            error: waitAndRefresh
        });
    }
});
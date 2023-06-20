import { loadSettings, cachedLogin } from "./load-settings.js";

const nameInput = document.getElementById('name');
const nameFeedbackSpan = document.getElementById('name-feedback');
const descriptionInput = document.getElementById('description');
const descriptionFeedbackSpan = document.getElementById('description-feedback');
const createButton = document.getElementById('create');

let validName = false;
let validDescription = false;
createButton.disabled = true;

loadSettings();

function redirectToIndex() {
    window.location.href = '/';
}

createButton.addEventListener('click', async () => {
    if(!(validName && validDescription)) return;
    $.ajax({
        url: '/api/chat/create',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            name: nameInput.value,
            description: descriptionInput.value
        }),
        contentType: 'application/json',
        success: redirectToIndex,
        error: redirectToIndex
    });
});

let automaticInsertionInterval = setInterval(() => {
    if(nameInput.value != '') nameTyped();
    if(descriptionInput.value != '') descriptionTyped();
    clearInterval(automaticInsertionInterval);
}, 250);

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
        createButton.disabled = true;
    } else if(name.length > 64) {
        nameFeedbackSpan.classList.replace('success', 'error');
        nameFeedbackSpan.innerText = 'Name too long!';
        validName = false;
        createButton.disabled = true;
    } else {
        for(let i = 0; i < name.length; i++) {
            const c = name.codePointAt(i);
            if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == 45 || c == 95 || c == 32))) {
                nameFeedbackSpan.classList.replace('success', 'error');
                nameFeedbackSpan.innerText = 'Name contains forbidden character!';
                validName = false;
                createButton.disabled = true;
                return;
            }
        }
        nameFeedbackSpan.classList.replace('error', 'success');
        nameFeedbackSpan.innerText = 'Valid Name';
        validName = true;
        createButton.disabled = !(validName && validDescription);
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
        createButton.disabled = true;
    } else if(description.length > 128) {
        descriptionFeedbackSpan.classList.replace('success', 'error');
        descriptionFeedbackSpan.innerText = 'Description too long!';
        validDescription = false;
        createButton.disabled = true;
    } else {
        descriptionFeedbackSpan.classList.replace('error', 'success');
        descriptionFeedbackSpan.innerText = 'Valid Description';
        validDescription = true;
        createButton.disabled = !(validName && validDescription);
        return;
    }
}
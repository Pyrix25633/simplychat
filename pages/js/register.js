const registerSectionDiv = document.getElementById('register-section');
const usernameInput = document.getElementById('username');
const usernameFeedbackSpan = document.getElementById('username-feedback');
const emailInput = document.getElementById('email');
const emailFeedbackSpan = document.getElementById('email-feedback');
const passwordInput = document.getElementById('password');
const passwordFeedbackSpan = document.getElementById('password-feedback');
const registerButton = document.getElementById('register');

let validUsername = false;
let validEmail = false;
let validPassword = false;

const confirmSectionDiv = document.getElementById('confirm-section');

confirmSectionDiv.style.display = 'none';

registerButton.addEventListener('click', async () => {
    if(!(validUsername && validEmail && validPassword)) return;
    $.ajax({
        url: '/api/user/register',
        method: 'POST',
        data: JSON.stringify({
            username: usernameInput.value,
            email: emailInput.value,
            passwordHash: await hashPassword(passwordInput.value)
        }),
        contentType: 'application/json',
        dataType: 'json',
        success: (ret) => {
            console.log(ret);
        },
        error: (req, err) => {
            console.log(err);
        }
    });
});

let usernameTimer;
usernameInput.addEventListener('keyup', () => {
    clearTimeout(usernameTimer);
    usernameTimer = setTimeout(usernameTyped, 1000);
});
usernameInput.addEventListener('keydown', () => {
    clearTimeout(usernameTimer);
});
function usernameTyped() {
    usernameFeedbackSpan.classList.add('success');
    let username = usernameInput.value;
    if(username.length < 4) {
        usernameFeedbackSpan.innerText = 'Username too short!';
        usernameFeedbackSpan.classList.replace('success', 'error');
        validUsername = false;
        return;
    }
    if(username.length > 32) {
        usernameFeedbackSpan.innerText = 'Username too long!';
        usernameFeedbackSpan.classList.replace('success', 'error');
        validUsername = false;
        return;
    }
    for(let i = 0; i < username.length; i++) {
        let c = username.codePointAt(i);
        if(!((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c == '-' || c == '_'))) {
            usernameFeedbackSpan.innerText = 'Username contains forbidden character!';
            validUsername = false;
            usernameFeedbackSpan.classList.replace('success', 'error');
            return;
        }
    }
    $.ajax({
        url: '/api/user/username-used?username=' + username,
        method: 'GET',
        dataType: 'json',
        success: (ret) => {
            validUsername = ret.used;
            if(validUsername) {
                usernameFeedbackSpan.innerText = 'Valid username';
                usernameFeedbackSpan.classList.replace('error', 'success');
                return;
            }
            usernameFeedbackSpan.innerText = 'Username already taken!';
            usernameFeedbackSpan.classList.replace('success', 'error');
        },
        error: (req, err) => {
            console.log(err);
            usernameFeedbackSpan.innerText = 'Server unreachable!';
            usernameFeedbackSpan.classList.replace('success', 'error');
        }
    });
}

let emailTimer;
emailInput.addEventListener('keyup', () => {
    clearTimeout(emailTimer);
    emailTimer = setTimeout(emailTyped, 1000);
});
emailInput.addEventListener('keydown', () => {
    clearTimeout(emailTimer);
});
function emailTyped() {
    emailFeedbackSpan.classList.add('success');
    let email = emailInput.value;
    if(!email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
        emailFeedbackSpan.innerText = 'Invalid email!';
        emailFeedbackSpan.classList.replace('success', 'error');
        validEmail = false;
        return;
    }
    $.ajax({
        url: '/api/user/email-used?email=' + email,
        method: 'GET',
        dataType: 'json',
        success: (ret) => {
            validEmail = ret.used;
            if(validEmail) {
                emailFeedbackSpan.innerText = 'Valid email';
                emailFeedbackSpan.classList.replace('error', 'success');
                return;
            }
            emailFeedbackSpan.innerText = 'Email already used!';
            emailFeedbackSpan.classList.replace('success', 'error');
        },
        error: (req, err) => {
            console.log(err);
            emailFeedbackSpan.innerText = 'Server unreachable!';
            emailFeedbackSpan.classList.replace('success', 'error');
        }
    });
}

async function hashPassword(password) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

$.ajax({
    url: '/api/user/confirm',
    method: 'POST',
    data: JSON.stringify({
        username: 'test',
        verificationCode: 45616
    }),
    contentType: 'application/json',
    dataType: 'json',
    success: (ret) => {
        console.log(ret);
    },
    error: (req, err) => {
        console.log(err);
    }
});

$.ajax({
    url: '/api/user/confirm',
    method: 'POST',
    data: JSON.stringify({
        username: 'seff',
        verificationCode: 45616
    }),
    contentType: 'application/json',
    dataType: 'json',
    success: (ret) => {
        console.log(ret);
    },
    error: (req, err) => {
        console.log(err);
    }
});
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
registerButton.disabled = true;

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
        success: (res) => {
            localStorage.setItem('pendingConfirm', JSON.stringify({
                username: usernameInput.value
            }));
            window.location.href = '/confirm';
        },
        error: (req, err) => {
            console.log(err);
        }
    });
});

let automaticInsertionInterval = setInterval(() => {
    if(usernameInput.value != '') usernameTyped();
    if(emailInput.value != '') emailTyped();
    if(passwordInput.value != '') passwordTyped();
    clearInterval(automaticInsertionInterval);
}, 250);

let usernameTimer;
usernameInput.addEventListener('keyup', () => {
    clearTimeout(usernameTimer);
    usernameTimer = setTimeout(usernameTyped, 1000);
});
usernameInput.addEventListener('keydown', () => {
    clearTimeout(usernameTimer);
});
usernameInput.addEventListener('focusout', () => {
    clearTimeout(usernameTimer);
    usernameTyped();
});
function usernameTyped() {
    usernameFeedbackSpan.classList.add('error');
    $.ajax({
        url: '/api/user/username-feedback?username=' + usernameInput.value,
        method: 'GET',
        dataType: 'json',
        success: (res) => {
            usernameFeedbackSpan.innerText = res.feedback;
            if(res.feedback.includes('!')) {
                usernameFeedbackSpan.classList.replace('success', 'error');
                validUsername = false;
                registerButton.disabled = true;
                return;
            }
            usernameFeedbackSpan.classList.replace('error', 'success');
            validUsername = true;
            registerButton.disabled = !(validUsername && validEmail && validPassword);
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
emailInput.addEventListener('focusout', () => {
    clearTimeout(emailTimer);
    emailTyped();
});
function emailTyped() {
    emailFeedbackSpan.classList.add('error');
    $.ajax({
        url: '/api/user/email-feedback?email=' + emailInput.value,
        method: 'GET',
        dataType: 'json',
        success: (res) => {
            emailFeedbackSpan.innerText = res.feedback;
            if(res.feedback.includes('!')) {
                emailFeedbackSpan.classList.replace('success', 'error');
                validEmail = false;
                registerButton.disabled = true;
                return;
            }
            emailFeedbackSpan.classList.replace('error', 'success');
            validEmail = true;
            registerButton.disabled = !(validUsername && validEmail && validPassword);
        },
        error: (req, err) => {
            console.log(err);
            emailFeedbackSpan.innerText = 'Server unreachable!';
            emailFeedbackSpan.classList.replace('success', 'error');
        }
    });
}

let passwordTimer;
passwordInput.addEventListener('keyup', () => {
    clearTimeout(passwordTimer);
    passwordTimer = setTimeout(passwordTyped, 1000);
});
passwordInput.addEventListener('keydown', () => {
    clearTimeout(passwordTimer);
});
passwordInput.addEventListener('focusout', () => {
    clearTimeout(passwordTimer);
    passwordTyped();
});
function passwordTyped() {
    passwordFeedbackSpan.classList.add('error');
    if(passwordInput.value.length < 4) {
        passwordFeedbackSpan.innerText = 'Password too short!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        registerButton.disabled = true;
        return;
    }
    if(passwordInput.value.length > 32) {
        passwordFeedbackSpan.innerText = 'Password too long!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        registerButton.disabled = true;
        return;
    }
    let numbers = 0, symbols = 0, uppercase = 0;
    for(let i = 0; i < passwordInput.value.length; i++) {
        let c = passwordInput.value.codePointAt(i);
        if(c >= 48 && c <= 57) numbers++;
        else if((c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126)) symbols++;
        else if(c >= 65 && c <= 90) uppercase++;
        else if(!(c >= 97 && c <= 122)) {
            passwordFeedbackSpan.innerText = 'Password contains forbidden character!'
            passwordFeedbackSpan.classList.replace('success', 'error');
            validPassword = false;
            registerButton.disabled = true;
            return;
        }
    }
    if(numbers < 2) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 2 numbers!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        registerButton.disabled = true;
    }
    else if(symbols < 1) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 1 symbol!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        registerButton.disabled = true;
    }
    else if(uppercase < 2) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 2 uppercase letters!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        registerButton.disabled = true;
    }
    else {
        passwordFeedbackSpan.innerText = 'Valid Password'
        passwordFeedbackSpan.classList.replace('error', 'success');
        validPassword = true;
        registerButton.disabled = !(validUsername && validEmail && validPassword);
    }
}

async function hashPassword(password) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
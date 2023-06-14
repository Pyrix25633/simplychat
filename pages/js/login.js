const usernameInput = document.getElementById('username');
const usernameFeedbackSpan = document.getElementById('username-feedback');
const passwordInput = document.getElementById('password');
const passwordFeedbackSpan = document.getElementById('password-feedback');
const loginButton = document.getElementById('login');

let validUsername = false;
let validPassword = false;
loginButton.disabled = true;

loginButton.addEventListener('click', async () => {
    if(!(validUsername && validPassword)) return;
    $.ajax({
        url: '/api/user/login',
        method: 'POST',
        data: JSON.stringify({
            username: usernameInput.value,
            passwordHash: await hashPassword(passwordInput.value)
        }),
        contentType: 'application/json',
        success: (res) => {
            localStorage.setItem('cachedLogin', JSON.stringify(res));
            window.location.href = '/';
        },
        statusCode: {
            400: () => {
                console.log('Error 400: Bad Request');
            },
            401: () => {
                passwordFeedbackSpan.innerText = "Wrong Password!";
                passwordFeedbackSpan.classList.replace('success', 'error');
                validPassword = false;
                loginButton.disabled = true;
            },
            404: () => {
                usernameFeedbackSpan.innerText = "Username not found!";
                usernameFeedbackSpan.classList.replace('success', 'error');
                validUsername = false;
                loginButton.disabled = true;
            },
            500: () => {
                console.log('Error 500: Internal Server Error');
            }
        }
    });
});

let automaticInsertionInterval = setInterval(() => {
    if(usernameInput.value != '') usernameTyped();
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
        url: '/api/user/username-login-feedback?username=' + usernameInput.value,
        method: 'GET',
        dataType: 'json',
        success: (res) => {
            usernameFeedbackSpan.innerText = res.feedback;
            if(res.feedback.includes('!')) {
                usernameFeedbackSpan.classList.replace('success', 'error');
                validUsername = false;
                loginButton.disabled = true;
                return;
            }
            usernameFeedbackSpan.classList.replace('error', 'success');
            validUsername = true;
            loginButton.disabled = !(validUsername && validPassword);
        },
        error: (req, err) => {
            console.log(err);
            usernameFeedbackSpan.innerText = 'Server unreachable!';
            usernameFeedbackSpan.classList.replace('success', 'error');
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
    if(passwordInput.value.length < 4 || passwordInput.value.length > 32) {
        passwordFeedbackSpan.innerText = 'Invalid Password!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        loginButton.disabled = true;
        return;
    }
    let numbers = 0, symbols = 0, uppercase = 0;
    for(let i = 0; i < passwordInput.value.length; i++) {
        let c = passwordInput.value.codePointAt(i);
        if(c >= 48 && c <= 57) numbers++;
        else if((c >= 33 && c <= 47) || (c >= 58 && c <= 64) || (c >= 91 && c <= 96) || (c >= 123 && c <= 126)) symbols++;
        else if(c >= 65 && c <= 90) uppercase++;
        else if(!(c >= 97 && c <= 122)) {
            passwordFeedbackSpan.innerText = 'Invalid Password!'
            passwordFeedbackSpan.classList.replace('success', 'error');
            validPassword = false;
            loginButton.disabled = true;
            return;
        }
    }
    if(numbers < 2 || symbols < 1 || uppercase < 2) {
        passwordFeedbackSpan.innerText = 'Invalid Password!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        loginButton.disabled = true;
    }
    else {
        passwordFeedbackSpan.innerText = 'Valid password'
        passwordFeedbackSpan.classList.replace('error', 'success');
        validPassword = true;
        loginButton.disabled = !(validUsername && validPassword);
    }
}

async function hashPassword(password) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
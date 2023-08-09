const compactModeCssLink = document.getElementById('compact-mode-css');
const sharpModeCssLink = document.getElementById('sharp-mode-css');
const fontCssLink = document.getElementById('font-css');

const pfpImage = document.getElementById('pfp');
const changePfpImage = document.getElementById('change-pfp');
const newPfpInput = document.getElementById('new-pfp');
const pfpFeedbackSpan = document.getElementById('pfp-feedback');

const idSpan = document.getElementById('id');
const usernameInput = document.getElementById('username');
const usernameFeedbackSpan = document.getElementById('username-feedback');
const emailInput = document.getElementById('email');
const emailFeedbackSpan = document.getElementById('email-feedback');
const statusInput = document.getElementById('status');
const statusFeedbackSpan = document.getElementById('status-feedback');

const passwordInput = document.getElementById('password');
const passwordFeedbackSpan = document.getElementById('password-feedback');
const regenerateTokenButton = document.getElementById('regenerate-token');
const tokenExpirationSpan = document.getElementById('token-expiration');
const tokenDurationInput = document.getElementById('token-duration');
const tokenDurationFeedbackSpan = document.getElementById('token-duration-feedback');
const tfaDiv = document.getElementById('tfa');
const tfaEnableDiv = document.getElementById('tfa-enable');
tfaEnableDiv.style.display = 'none';

const compactModeDiv = document.getElementById('compact-mode');
const aurebeshFontDiv = document.getElementById('aurebesh-font');
const condensedFontDiv = document.getElementById('condensed-font');
const sharpModeDiv = document.getElementById('sharp-mode');

const cancelButton = document.getElementById('cancel');
const saveButton = document.getElementById('save');

const oneDayTimestamp = 60 * 60 * 24;

let settings;
let validUsername = true;
let validEmail = true;
let validStatus = true;
let validPassword = true;
let validTokenDuration = true;
let validTfaCode = true;
saveButton.disabled = true;

const cachedLogin = JSON.parse(localStorage.getItem('cachedLogin'));
const statusCodeActions = {
    400: () => {
        console.log('Error 400: Bad Request');
    },
    401: () => {
        window.location.href = '/login';
    },
    404: () => {
        window.location.href = '/register';
    },
    500: () => {
        console.log('Error 500: Internal Server Error');
    }
};

if(cachedLogin == null || cachedLogin.id == undefined || cachedLogin.token == undefined)
    window.location.href = '/login';
else {
    $.ajax({
        url: '/api/user/validate-token',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: (res) => {
            if(res.valid)
                getSettings();
            else
                window.location.href = '/login';
        },
        statusCode: statusCodeActions
    });
}

function getSettings() {
    $.ajax({
        url: '/api/user/get-settings',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: showSettings,
        statusCode: statusCodeActions
    });
}

function showSettings(res) {
    settings = res;
    pfpImage.src = './pfps/' + cachedLogin.id + '.' + res.pfpType;
    idSpan.innerText = cachedLogin.id;
    usernameInput.value = res.username;
    emailInput.value = res.email;
    statusInput.value = res.status;
    const tokenExpiration = new Date(res.tokenExpiration * 1000);
    const tokenExpirationOffset = tokenExpiration.getTimezoneOffset();
    tokenExpirationSpan.innerText = new Date(tokenExpiration.getTime() - (tokenExpirationOffset*60*1000))
        .toISOString().split('.')[0].replace('T', ' ').replaceAll('-', '/');
    tokenDurationInput.value = res.tokenDuration / oneDayTimestamp;
    tfaDiv.classList.add(res.settings.tfaActive ? 'on': 'off');
    compactModeDiv.classList.add(res.settings.compactMode ? 'on': 'off');
    compactModeCssLink.href = './css/compact-mode-' + (res.settings.compactMode ? 'on': 'off') + '.css';
    condensedFontDiv.classList.add(res.settings.condensedFont ? 'on': 'off');
    aurebeshFontDiv.classList.add(res.settings.aurebeshFont ? 'on': 'off');
    setFont();
    sharpModeDiv.classList.add(res.settings.sharpMode ? 'on': 'off');
    sharpModeCssLink.href = './css/sharp-mode-' + (res.settings.sharpMode ? 'on': 'off') + '.css';
}

changePfpImage.addEventListener('click', () => {
    var evt = document.createEvent("MouseEvents");
    evt.initEvent("click", true, false);
    newPfpInput.dispatchEvent(evt);
});

newPfpInput.addEventListener('change', () => {
    const pfpType = newPfpInput.value.split('.').pop();
    pfpFeedbackSpan.classList.add('error');
    function invalidType() {
        pfpFeedbackSpan.innerText = 'Profile Picture type must be SVG, PNG, JPG, JPEG or GIF!';
        pfpFeedbackSpan.classList.replace('success', 'error');
    }
    if(pfpType != 'svg' && pfpType != 'png' && pfpType != 'jpg' && pfpType != 'jpeg' && pfpType != 'gif') {
        invalidType();
        return;
    }
    const image = new Image();
    image.onload = () => {
        if(image.width == image.height) {
            if(image.width >= 512 && image.width <= 2048) {
                pfpFeedbackSpan.innerText = 'Valid Profile Picture';
                pfpFeedbackSpan.classList.replace('error', 'success');
                pfpImage.src = image.src;
                saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
                settings.pfpType = pfpType;
                settings.pfp = pfpImage.src;
            }
            else {
                pfpFeedbackSpan.innerText = 'Profile Picture resolution must be between 512x512 and 2048x2048!';
                pfpFeedbackSpan.classList.replace('success', 'error');
            }
        } else {
            pfpFeedbackSpan.innerText = 'Profile Picture type must be a square!';
            pfpFeedbackSpan.classList.replace('success', 'error');
        }
    };
    image.onerror = invalidType;
    const reader = new FileReader();
    reader.onload = (e) => {
        image.src = e.target.result;
    };
    reader.readAsDataURL(newPfpInput.files[0]);
});

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
    if(usernameInput.value == settings.username) {
        usernameFeedbackSpan.classList.remove('error', 'success');
        usernameFeedbackSpan.innerText = 'You can change your Username';
        return;
    }
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
                saveButton.disabled = true;
                return;
            }
            usernameFeedbackSpan.classList.replace('error', 'success');
            validUsername = true;
            saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
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
    if(emailInput.value == settings.email) {
        emailFeedbackSpan.classList.remove('error', 'success');
        emailFeedbackSpan.innerText = 'You can change your Email';
        return;
    }
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
                saveButton.disabled = true;
                return;
            }
            emailFeedbackSpan.classList.replace('error', 'success');
            validEmail = true;
            saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
        },
        error: (req, err) => {
            console.log(err);
            emailFeedbackSpan.innerText = 'Server unreachable!';
            emailFeedbackSpan.classList.replace('success', 'error');
        }
    });
}

let statusTimer;
statusInput.addEventListener('keyup', () => {
    clearTimeout(statusTimer);
    statusTimer = setTimeout(statusTyped, 1000);
});
statusInput.addEventListener('keydown', () => {
    clearTimeout(statusTimer);
});
statusInput.addEventListener('focusout', () => {
    clearTimeout(statusTimer);
    statusTyped();
});
function statusTyped() {
    if(statusInput.value == settings.status) {
        statusFeedbackSpan.classList.remove('error', 'success');
        statusFeedbackSpan.innerText = 'You can change your Status';
        return;
    }
    statusFeedbackSpan.classList.add('error');
    if(statusInput.value.length < 3) {
        statusFeedbackSpan.innerText = 'Status too short!'
        statusFeedbackSpan.classList.replace('success', 'error');
        validStatus = false;
        saveButton.disabled = true;
        return;
    }
    if(statusInput.value.length > 64) {
        statusFeedbackSpan.innerText = 'Status too long!'
        statusFeedbackSpan.classList.replace('success', 'error');
        validStatus = false;
        saveButton.disabled = true;
        return;
    }
    else {
        statusFeedbackSpan.innerText = 'Valid Status'
        statusFeedbackSpan.classList.replace('error', 'success');
        validPassword = true;
        saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
    }
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
    if(passwordInput.value == '') {
        passwordFeedbackSpan.classList.remove('error', 'success');
        passwordFeedbackSpan.innerText = 'You can change your Password';
        return;
    }
    passwordFeedbackSpan.classList.add('error');
    if(passwordInput.value.length < 4) {
        passwordFeedbackSpan.innerText = 'Password too short!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        saveButton.disabled = true;
        return;
    }
    if(passwordInput.value.length > 32) {
        passwordFeedbackSpan.innerText = 'Password too long!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        saveButton.disabled = true;
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
            saveButton.disabled = true;
            return;
        }
    }
    if(numbers < 2) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 2 numbers!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        saveButton.disabled = true;
    }
    else if(symbols < 1) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 1 symbol!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        saveButton.disabled = true;
    }
    else if(uppercase < 2) {
        passwordFeedbackSpan.innerText = 'Password should contain at least 2 uppercase letters!'
        passwordFeedbackSpan.classList.replace('success', 'error');
        validPassword = false;
        saveButton.disabled = true;
    }
    else {
        passwordFeedbackSpan.innerText = 'Valid Password'
        passwordFeedbackSpan.classList.replace('error', 'success');
        validPassword = true;
        saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
    }
}

regenerateTokenButton.addEventListener('click', () => {
    $.ajax({
        url: '/api/user/regenerate-token',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id
        }),
        contentType: 'application/json',
        success: waitAndRefresh,
        error: waitAndRefresh
    });
});

let tokenDurationTimer;
tokenDurationInput.addEventListener('keyup', () => {
    clearTimeout(tokenDurationTimer);
    tokenDurationTimer = setTimeout(tokenDurationTyped, 1000);
});
tokenDurationInput.addEventListener('keydown', () => {
    clearTimeout(tokenDurationTimer);
});
tokenDurationInput.addEventListener('focusout', () => {
    clearTimeout(tokenDurationTimer);
    tokenDurationTyped();
});
function tokenDurationTyped() {
    if(tokenDurationInput.value == '') {
        tokenDurationFeedbackSpan.classList.remove('error', 'success');
        tokenDurationFeedbackSpan.innerText = 'You can change your Token Duration (Days)';
        return;
    }
    tokenDurationFeedbackSpan.classList.add('error');
    const tokenDuration = parseInt(tokenDurationInput.value);
    if(tokenDuration < 5) {
        tokenDurationFeedbackSpan.innerText = 'Token Duration too short!'
        tokenDurationFeedbackSpan.classList.replace('success', 'error');
        validTokenDuration = false;
        saveButton.disabled = true;
    }
    else if(tokenDuration > 90) {
        tokenDurationFeedbackSpan.innerText = 'Tooken Duration too long!'
        tokenDurationFeedbackSpan.classList.replace('success', 'error');
        validTokenDuration = false;
        saveButton.disabled = true;
    }
    else {
        tokenDurationFeedbackSpan.innerText = 'Valid Token Duration'
        tokenDurationFeedbackSpan.classList.replace('error', 'success');
        validTokenDuration = true;
        saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
    }
}

//TODO

for(let e of document.getElementsByClassName('slider')) {
    e.addEventListener('click', () => {
        if(e.classList.contains('on'))
            e.classList.replace('on', 'off');
        else
            e.classList.replace('off', 'on');
    });
}

function setFont() {
    fontCssLink.href = './css/' + (settings.settings.aurebeshFont ? 'aurebesh' : 'roboto') + '-condensed-' + (settings.settings.condensedFont ? 'on': 'off') + '.css';
}

compactModeDiv.addEventListener('click', () => {
    settings.settings.compactMode = compactModeDiv.classList.contains('on');
    compactModeCssLink.href = './css/compact-mode-' + (settings.settings.compactMode ? 'on': 'off') + '.css';
    saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);

});
condensedFontDiv.addEventListener('click', () => {
    settings.settings.condensedFont = condensedFontDiv.classList.contains('on');
    setFont();
    saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
});
aurebeshFontDiv.addEventListener('click', () => {
    settings.settings.aurebeshFont = aurebeshFontDiv.classList.contains('on');
    setFont();
    saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
});
sharpModeDiv.addEventListener('click', () => {
    settings.settings.sharpMode = sharpModeDiv.classList.contains('on');
    sharpModeCssLink.href = './css/sharp-mode-' + (settings.settings.sharpMode ? 'on': 'off') + '.css';
    saveButton.disabled = !(validUsername && validEmail && validStatus && validPassword && validTokenDuration && validTfaCode);
});

async function hashPassword(password) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-512", new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

cancelButton.addEventListener('click', () => {
    window.location.href = '/settings';
});

function waitAndRefresh() {
    setInterval(() => {
        window.location.href = '/settings';
    }, 250);
}

saveButton.addEventListener('click', async () => {
    if(!(validUsername && validEmail && validStatus && validPassword && validTokenDuration)) return;
    $.ajax({
        url: '/api/user/set-settings',
        method: 'POST',
        data: JSON.stringify({
            token: cachedLogin.token,
            id: cachedLogin.id,
            username: usernameInput.value,
            email: emailInput.value,
            passwordHash: (passwordInput.value.length != 0) ? await hashPassword(passwordInput.value) : '',
            tokenDuration: tokenDurationInput.value * oneDayTimestamp,
            status: statusInput.value,
            settings: settings.settings
        }),
        contentType: 'application/json',
        success: waitAndRefresh,
        error: waitAndRefresh
    });
    if(settings.pfp != undefined) {
        $.ajax({
            url: '/api/user/set-pfp',
            method: 'POST',
            data: JSON.stringify({
                token: cachedLogin.token,
                id: cachedLogin.id,
                pfp: settings.pfp,
                pfpType: settings.pfpType
            }),
            contentType: 'application/json',
            success: waitAndRefresh,
            error: waitAndRefresh
        });
    }
});
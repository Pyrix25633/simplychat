const usernameInput = document.getElementById('username');
const usernameFeedbackSpan = document.getElementById('username-feedback');
const verificationCodeInput = document.getElementById('verification-code');
const verificationCodeFeedbackSpan = document.getElementById('verification-code-feedback');
const confirmButton = document.getElementById('confirm');

let validUsername = false;
let validVerificationCode = false;
confirmButton.disabled = true;

let pendingConfirm = JSON.parse(localStorage.getItem('pendingConfirm'));
let urlParams = new URLSearchParams(window.location.search);
let urlPendingConfirm = {username: urlParams.get('username'), verificationCode: urlParams.get('verificationCode')};
if(pendingConfirm != null) {
    if(urlPendingConfirm.username != null || urlPendingConfirm.verificationCode != null) {
        usernameInput.value = urlPendingConfirm.username;
        verificationCodeInput.value = urlPendingConfirm.verificationCode;
    }
    else
        usernameInput.value = pendingConfirm.username;
}
else if(urlPendingConfirm.username != null || urlPendingConfirm.verificationCode != null) {
    usernameInput.value = urlPendingConfirm.username;
    verificationCodeInput.value = urlPendingConfirm.verificationCode;
}

confirmButton.addEventListener('click', async () => {
    if(!(validUsername && validVerificationCode)) return;
    $.ajax({
        url: '/api/user/confirm',
        method: 'POST',
        data: JSON.stringify({
            username: usernameInput.value,
            verificationCode: parseInt(verificationCodeInput.value)
        }),
        contentType: 'application/json',
        success: (res) => {
            if(pendingConfirm != null && pendingConfirm.username == urlPendingConfirm)
                localStorage.setItem('pendingConfirm', null);
            localStorage.setItem('cachedLogin', JSON.stringify(res));
            window.location.href = '/';
        },
        statusCode: {
            400: () => {
                console.log('Error 400: Bad Request');
            },
            401: () => {
                verificationCodeFeedbackSpan.innerText = "Wrong Verification Code!";
                verificationCodeFeedbackSpan.classList.replace('success', 'error');
                validVerificationCode = false;
                confirmButton.disabled = true;
            },
            404: () => {
                usernameFeedbackSpan.innerText = "Username not found!";
                usernameFeedbackSpan.classList.replace('success', 'error');
                validUsername = false;
                confirmButton.disabled = true;
            },
            500: () => {
                console.log('Error 500: Internal Server Error');
            }
        }
    });
});

let automaticInsertionInterval = setInterval(() => {
    if(usernameInput.value != '') usernameTyped();
    if(verificationCodeInput.value != '') verificationCodeTyped();
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
function usernameTyped() {
    usernameFeedbackSpan.classList.add('error');
    $.ajax({
        url: '/api/user/username-confirm-feedback?username=' + usernameInput.value,
        method: 'GET',
        dataType: 'json',
        success: (res) => {
            usernameFeedbackSpan.innerText = res.feedback;
            if(res.feedback.includes('!')) {
                usernameFeedbackSpan.classList.replace('success', 'error');
                validUsername = false;
                confirmButton.disabled = true;
                return;
            }
            usernameFeedbackSpan.classList.replace('error', 'success');
            validUsername = true;
            confirmButton.disabled = !(validUsername && validVerificationCode);
        },
        error: (req, err) => {
            console.log(err);
            usernameFeedbackSpan.innerText = 'Server unreachable!';
            usernameFeedbackSpan.classList.replace('success', 'error');
        }
    });
}

let verificationCodeTimer;
verificationCodeInput.addEventListener('keyup', () => {
    clearTimeout(verificationCodeTimer);
    verificationCodeTimer = setTimeout(verificationCodeTyped, 1000);
});
verificationCodeInput.addEventListener('keydown', () => {
    clearTimeout(verificationCodeTimer);
});
function verificationCodeTyped() {
    verificationCodeFeedbackSpan.classList.add('error');
    let verificationCode = parseInt(verificationCodeInput.value);
    if(isNaN(verificationCode) || verificationCode < 100000 || verificationCode > 999999) {
        verificationCodeFeedbackSpan.innerText = 'Invalid Verification Code!';
        verificationCodeFeedbackSpan.classList.replace('success', 'error');
        validVerificationCode = false;
        confirmButton.disabled = true;
        return;
    }
    verificationCodeFeedbackSpan.innerText = 'Valid Verification Code';
    verificationCodeFeedbackSpan.classList.replace('error', 'success');
    validVerificationCode = true;
    confirmButton.disabled = !(validUsername && validVerificationCode);
}
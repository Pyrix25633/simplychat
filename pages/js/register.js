const registerSectionDiv = document.getElementById('register-section');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('register');

const confirmSectionDiv = document.getElementById('confirm-section');

confirmSectionDiv.style.display = 'none';

registerButton.addEventListener('click', async () => {
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
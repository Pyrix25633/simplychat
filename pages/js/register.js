const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const registerButton = document.getElementById('register');

registerButton.addEventListener('click', () => {
    $.ajax({
        url: '/api/user/register',
        method: 'POST',
        data: JSON.stringify({
            username: usernameInput.value,
            email: emailInput.value,
            passwordHash: hashPassword(passwordInput.value)
        }),
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
    const hashBuffer = await window.crypto.subtle.digest("SHA-3-512", new TextEncoder().encode(password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
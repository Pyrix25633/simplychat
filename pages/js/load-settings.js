const compactModeCssLink = document.getElementById('compact-mode-css');
const sharpModeCssLink = document.getElementById('sharp-mode-css');
const fontCssLink = document.getElementById('font-css');

export const cachedLogin = JSON.parse(localStorage.getItem('cachedLogin'));
export const statusCodeActions = {
    400: () => {
        console.log('Error 400: Bad Request');
    },
    401: () => {
        window.location.href = '/login';
    },
    403: () => {
        window.location.href = '/';
    },
    404: () => {
        window.location.href = '/register';
    },
    500: () => {
        console.log('Error 500: Internal Server Error');
    }
};

export function loadSettings(callback) {
    if(cachedLogin == null || cachedLogin.id == undefined || cachedLogin.token == undefined)
        window.location.href = '/login';
    else {
        $.ajax({
            url: '/api/user/validate-token',
            method: 'POST',
            data: JSON.stringify(cachedLogin),
            contentType: 'application/json',
            success: (res) => {
                if(res.valid) {
                    getSettings();
                    if(typeof callback == 'function')
                        callback();
                }
                else
                    window.location.href = '/login';
            },
            statusCode: statusCodeActions
        });
    }
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
    compactModeCssLink.href = './css/compact-mode-' + (res.settings.compactMode ? 'on': 'off') + '.css';
    fontCssLink.href = './css/' + (res.settings.aurebeshFont ? 'aurebesh' : 'roboto') + '-condensed-' + (res.settings.condensedFont ? 'on': 'off') + '.css';
    sharpModeCssLink.href = './css/sharp-mode-' + (res.settings.sharpMode ? 'on': 'off') + '.css';
}
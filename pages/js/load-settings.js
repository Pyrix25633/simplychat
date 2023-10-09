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

let settings;

export function loadSettings(callback, whenFinished) {
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
                    if(whenFinished) {
                        getSettings(callback);
                    }
                    else {
                        getSettings();
                        if(typeof callback == 'function')
                            callback();
                    }
                }
                else
                    window.location.href = '/login';
            },
            statusCode: statusCodeActions
        });
    }
}

function getSettings(callback) {
    $.ajax({
        url: '/api/user/get-settings',
        method: 'POST',
        data: JSON.stringify(cachedLogin),
        contentType: 'application/json',
        success: (res) => {
            settings = res.settings;
            showSettings(res.settings);
            if(typeof callback == 'function')
                callback(settings);
        },
        statusCode: statusCodeActions
    });
}

function showSettings(settings) {
    compactModeCssLink.href = './css/compact-mode-' + (settings.compactMode ? 'on': 'off') + '.css';
    fontCssLink.href = './css/' + (settings.aurebeshFont ? 'aurebesh' : 'roboto') + '-condensed-' + (settings.condensedFont ? 'on': 'off') + '.css';
    sharpModeCssLink.href = './css/sharp-mode-' + (settings.sharpMode ? 'on': 'off') + '.css';
}
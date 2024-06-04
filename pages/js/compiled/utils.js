function navigateToErrorPage(req) {
    window.location.href = '/error?code=' + req.status + '&message=' + req.statusText;
}
export const pendingActionKey = 'pendingAction';
export const defaultStatusCode = {
    400: (req) => {
        navigateToErrorPage(req);
    },
    401: () => {
        localStorage.setItem(pendingActionKey, window.location.pathname);
        window.location.href = '/login';
    },
    403: (req) => {
        navigateToErrorPage(req);
    },
    404: (req) => {
        navigateToErrorPage(req);
    },
    405: (req) => {
        navigateToErrorPage(req);
    },
    422: (req) => {
        navigateToErrorPage(req);
    },
    500: (req) => {
        navigateToErrorPage(req);
    }
};
export const imageButtonAnimationKeyframes = [
    { transform: 'scale(0.6)' },
    { transform: 'scale(1.4)' },
    { transform: 'scale(1)' }
];
export const imageButtonAnimationOptions = {
    duration: 250
};
export class RequireNonNull {
    static getElementById(id) {
        const element = document.getElementById(id);
        if (element != null)
            return element;
        throw new Error('No element found with id: ' + id);
    }
    static parse(value) {
        if (value == null)
            throw new Error('Null not allowed');
        return value;
    }
}
export class Auth {
    static getCookie() {
        const match = document.cookie.match(new RegExp(Auth._name + "=(.+?)(?:;|$)"));
        if (match == null)
            throw new Error('Auth Cookie not found!');
        return match[1];
    }
    static async validateToken() {
        return new Promise((resolve) => {
            $.ajax({
                url: '/api/auth/validate-token',
                method: 'GET',
                success: (res) => {
                    if (res.valid)
                        resolve();
                    else {
                        localStorage.setItem(pendingActionKey, window.location.pathname);
                        window.location.href = '/login';
                    }
                },
                statusCode: defaultStatusCode
            });
        });
    }
}
Auth._name = 'simplychat-auth';
const cachedCustomizationKey = 'cachedCustomization';
export class Customization {
    constructor(json) {
        var _a, _b, _c, _d;
        this.compactMode = (_a = json === null || json === void 0 ? void 0 : json.compactMode) !== null && _a !== void 0 ? _a : false;
        this.condensedFont = (_b = json === null || json === void 0 ? void 0 : json.condensedFont) !== null && _b !== void 0 ? _b : false;
        this.aurebeshFont = (_c = json === null || json === void 0 ? void 0 : json.aurebeshFont) !== null && _c !== void 0 ? _c : false;
        this.sharpMode = (_d = json === null || json === void 0 ? void 0 : json.sharpMode) !== null && _d !== void 0 ? _d : false;
    }
    static loadCached() {
        var _a;
        return new Customization(JSON.parse((_a = localStorage.getItem(cachedCustomizationKey)) !== null && _a !== void 0 ? _a : 'null'));
    }
    static async get() {
        return new Promise((resolve) => {
            $.ajax({
                url: '/api/settings/customization',
                method: 'GET',
                success: (res) => {
                    resolve(new Customization(res));
                },
                statusCode: defaultStatusCode
            });
        });
    }
    cache() {
        localStorage.setItem(cachedCustomizationKey, JSON.stringify(this));
    }
}
export class CssManager {
    constructor() {
        this.compactModeCssLink = RequireNonNull.getElementById('compact-mode-css');
        this.sharpModeCssLink = RequireNonNull.getElementById('sharp-mode-css');
        this.fontCssLink = RequireNonNull.getElementById('font-css');
    }
    applyStyle(customization) {
        this.compactModeCssLink.href = CssManager.buildLink('compact-mode', customization.compactMode);
        this.sharpModeCssLink.href = CssManager.buildLink('sharp-mode', customization.sharpMode);
        this.fontCssLink.href = CssManager.buildLink((customization.aurebeshFont ? 'aurebesh' : 'roboto') + '-condensed', customization.condensedFont);
    }
    static buildLink(name, on) {
        return '/css/' + name + '-' + (on ? 'on' : 'off') + '.css';
    }
}
export const PermissionLevels = ["ADMINISTRATOR", "MODERATOR", "USER", "VIEWER"];
export var PermissionLevel;
(function (PermissionLevel) {
    function increase(permissionLevel) {
        switch (permissionLevel) {
            case "MODERATOR": return "ADMINISTRATOR";
            case "USER": return "MODERATOR";
            case "VIEWER": return "USER";
            default: return "ADMINISTRATOR";
        }
    }
    PermissionLevel.increase = increase;
    function decrease(permissionLevel) {
        switch (permissionLevel) {
            case "ADMINISTRATOR": return "MODERATOR";
            case "MODERATOR": return "USER";
            case "USER": return "VIEWER";
            default: return "VIEWER";
        }
    }
    PermissionLevel.decrease = decrease;
    function compare(a, b) {
        if (a == b)
            return 0;
        if (a == "ADMINISTRATOR")
            return -1;
        if (b == "ADMINISTRATOR")
            return 1;
        if (a == "MODERATOR")
            return -1;
        if (b == "MODERATOR")
            return 1;
        if (a == "USER")
            return -1;
        else
            return 1;
    }
    PermissionLevel.compare = compare;
})(PermissionLevel || (PermissionLevel = {}));
export function setDynamicallyUpdatedDate(span, date, text = '$') {
    const minute = 60, hour = minute * 60, day = hour * 24;
    let difference = Math.floor((Date.now() - date.getTime()) / 1000);
    const seconds = difference % minute;
    difference -= seconds;
    const minutes = Math.floor(difference / minute) % 60;
    difference -= minutes;
    const hours = Math.floor(difference / hour) % 24;
    difference -= hours;
    const days = Math.floor(difference / day);
    if (days < 7) {
        let delay = 1000;
        let readableDate;
        if (days == 0) {
            if (hours == 0) {
                if (minutes == 0)
                    readableDate = seconds + ' Second' + (seconds == 1 ? '' : 's');
                else {
                    readableDate = minutes + ' Minute' + (minutes == 1 ? '' : 's');
                    delay *= minute;
                }
            }
            else {
                readableDate = hours + ' Hour' + (hours == 1 ? '' : 's');
                delay *= hour;
            }
        }
        else {
            readableDate = days + ' Day' + (days == 1 ? '' : 's');
            delay *= day;
        }
        readableDate += ' ago';
        span.innerText = text.replace('$', readableDate);
        if (span.timeout != undefined)
            clearTimeout(span.timeout);
        span.timeout = setTimeout(() => {
            setDynamicallyUpdatedDate(span, date, text);
        }, delay);
    }
    else {
        if (span.timeout != undefined)
            clearTimeout(span.timeout);
        span.innerText = text.replace('$', date.toLocaleString('en-ZA'));
    }
}

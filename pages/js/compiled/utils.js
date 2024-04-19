"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssManager = exports.CssSettings = exports.Auth = exports.RequireNonNull = exports.defaultStatusCode = void 0;
exports.defaultStatusCode = {
    400: () => {
        window.location.href = '/400.html';
    },
    401: () => {
        window.location.href = '/login';
    },
    403: () => {
        window.location.href = '/403.html';
    },
    404: () => {
        window.location.href = '/404.html';
    },
    405: () => {
        window.location.href = '/405.html';
    },
    422: () => {
        window.location.href = '/422.html';
    },
    500: () => {
        window.location.href = '/500.html';
    }
};
class RequireNonNull {
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
exports.RequireNonNull = RequireNonNull;
class Auth {
    static async validateToken() {
        return new Promise((resolve) => {
            $.ajax({
                url: '/api/auth/validate-token',
                method: 'GET',
                success: (res) => {
                    if (res.valid)
                        resolve();
                    else
                        window.location.href = '/login';
                },
                statusCode: exports.defaultStatusCode
            });
        });
    }
}
exports.Auth = Auth;
class CssSettings {
    constructor(json) {
        var _a, _b, _c;
        this.compactMode = (_a = json === null || json === void 0 ? void 0 : json.compactMode) !== null && _a !== void 0 ? _a : false;
        this.condensedFont = (_b = json === null || json === void 0 ? void 0 : json.condensedFont) !== null && _b !== void 0 ? _b : false;
        this.sharpMode = (_c = json === null || json === void 0 ? void 0 : json.sharpMode) !== null && _c !== void 0 ? _c : false;
    }
    static loadCached() {
        var _a;
        return new CssSettings(JSON.parse((_a = localStorage.getItem('cachedSettings')) !== null && _a !== void 0 ? _a : 'null'));
    }
    static async get() {
        return new Promise((resolve) => {
            $.ajax({
                url: '/api/auth/settings',
                method: 'GET',
                success: (res) => {
                    resolve(new CssSettings(res));
                },
                statusCode: exports.defaultStatusCode
            });
        });
    }
    static cache(settings) {
        localStorage.setItem('cachedSettings', JSON.stringify(settings));
    }
}
exports.CssSettings = CssSettings;
class CssManager {
    constructor() {
        this.compactModeCssLink = RequireNonNull.getElementById('compact-mode-css');
        this.sharpModeCssLink = RequireNonNull.getElementById('sharp-mode-css');
        this.fontCssLink = RequireNonNull.getElementById('font-css');
    }
    applyStyle(settings) {
        this.compactModeCssLink.href = CssManager.buildLink('compact-mode', settings.compactMode);
        this.sharpModeCssLink.href = CssManager.buildLink('sharp-mode', settings.sharpMode);
        this.fontCssLink.href = CssManager.buildLink('roboto-condensed', settings.condensedFont);
    }
    static buildLink(name, on) {
        return '/css/' + name + '-' + (on ? 'on' : 'off') + '.css';
    }
}
exports.CssManager = CssManager;

export type Success = (res: object) => void;
export type StatusCode = { [index: number]: () => void; };

export const defaultStatusCode: StatusCode = {
    400: (): void => {
        window.location.href = '/400.html';
    },
    401: (): void => {
        window.location.href = '/login';
    },
    403: (): void => {
        window.location.href = '/403.html';
    },
    404: (): void => {
        window.location.href = '/404.html';
    },
    405: (): void => {
        window.location.href = '/405.html';
    },
    422: (): void => {
        window.location.href = '/422.html';
    },
    500: (): void => {
        window.location.href = '/500.html';
    }
};

export class RequireNonNull {
    static getElementById(id: string): HTMLElement {
        const element = document.getElementById(id);
        if(element != null) return element;
        throw new Error('No element found with id: ' + id);
    }

    static parse<T>(value: T | null): T {
        if(value == null) throw new Error('Null not allowed');
        return value;
    }
}

export class Auth {
    static async validateToken(): Promise<void> {
        return new Promise((resolve): void => {
            $.ajax({
                url: '/api/auth/validate-token',
                method: 'GET',
                success: (res: {valid: boolean}) => {
                    if(res.valid)
                        resolve();
                    else
                        window.location.href = '/login';
                },
                statusCode: defaultStatusCode
            });
        });
    }
}

export class CssSettings {
    readonly compactMode: boolean;
    readonly condensedFont: boolean;
    readonly sharpMode: boolean;

    constructor(json: { [index: string]: any; } | null) {
        this.compactMode = json?.compactMode ?? false;
        this.condensedFont = json?.condensedFont ?? false;
        this.sharpMode = json?.sharpMode ?? false;
    }

    static loadCached(): CssSettings {
        return new CssSettings(JSON.parse(localStorage.getItem('cachedSettings') ?? 'null'));
    }

    static async get(): Promise<CssSettings> {
        return new Promise((resolve): void => {
            $.ajax({
                url: '/api/auth/settings',
                method: 'GET',
                success: (res: {compactMode: boolean, condensedFont: boolean, sharpMode: boolean}) => {
                    resolve(new CssSettings(res));
                },
                statusCode: defaultStatusCode
            });
        });
    }

    static cache(settings: CssSettings): void {
        localStorage.setItem('cachedSettings', JSON.stringify(settings));
    }
}

export class CssManager {
    readonly compactModeCssLink: HTMLLinkElement;
    readonly sharpModeCssLink: HTMLLinkElement;
    readonly fontCssLink: HTMLLinkElement;

    constructor() {
        this.compactModeCssLink = RequireNonNull.getElementById('compact-mode-css') as HTMLLinkElement;
        this.sharpModeCssLink = RequireNonNull.getElementById('sharp-mode-css') as HTMLLinkElement;
        this.fontCssLink = RequireNonNull.getElementById('font-css') as HTMLLinkElement;
    }

    applyStyle(settings: CssSettings): void {
        this.compactModeCssLink.href = CssManager.buildLink('compact-mode', settings.compactMode);
        this.sharpModeCssLink.href = CssManager.buildLink('sharp-mode', settings.sharpMode);
        this.fontCssLink.href = CssManager.buildLink('roboto-condensed', settings.condensedFont);
    }

    private static buildLink(name: string, on: boolean): string {
        return '/css/' + name + '-' + (on ? 'on' : 'off') + '.css';
    }
}
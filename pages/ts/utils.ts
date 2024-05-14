export type Response = { [index: string]: any; };
export type Success = (res: Response) => void;
export type StatusCode = { [index: number]: (req: JQueryXHR, message: string, error: string) => void; };

function navigateToErrorPage(req: JQueryXHR): void {
    window.location.href = '/error?code=' + req.status + '&message=' + req.statusText;
}

export const defaultStatusCode: StatusCode = {
    400: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    },
    401: (): void => {
        window.location.href = '/login';
    },
    403: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    },
    404: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    },
    405: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    },
    422: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    },
    500: (req: JQueryXHR): void => {
        navigateToErrorPage(req);
    }
};

export const imageButtonAnimationKeyframes: { transform: string; }[] = [
    { transform: 'scale(0.6)' },
    { transform: 'scale(1.4)' },
    { transform: 'scale(1)' }
];
export const imageButtonAnimationOptions: { duration: number; } = {
    duration: 250
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
    public static readonly _name = 'simplychat-auth';

    static getCookie(): string {
        const match = document.cookie.match(Auth._name + /=(\w+)/);
        if(match == null)
            throw new Error('Auth Cookie not found!');
        return match[1];
    }

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

export class Customization {
    readonly compactMode: boolean;
    readonly condensedFont: boolean;
    readonly aurebeshFont: boolean;
    readonly sharpMode: boolean;

    constructor(json: { [index: string]: any; } | null) {
        this.compactMode = json?.compactMode ?? false;
        this.condensedFont = json?.condensedFont ?? false;
        this.aurebeshFont = json?.aurebeshFont ?? false;
        this.sharpMode = json?.sharpMode ?? false;
    }

    static loadCached(): Customization {
        return new Customization(JSON.parse(localStorage.getItem('cachedCustomization') ?? 'null'));
    }

    static async get(): Promise<Customization> {
        return new Promise((resolve: (settings: Customization) => void): void => {
            $.ajax({
                url: '/api/settings/customization',
                method: 'GET',
                success: (res: {compactMode: boolean, condensedFont: boolean, sharpMode: boolean}) => {
                    resolve(new Customization(res));
                },
                statusCode: defaultStatusCode
            });
        });
    }

    cache(): void {
        localStorage.setItem('cachedCustomization', JSON.stringify(this));
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

    applyStyle(customization: Customization): void {
        this.compactModeCssLink.href = CssManager.buildLink('compact-mode', customization.compactMode);
        this.sharpModeCssLink.href = CssManager.buildLink('sharp-mode', customization.sharpMode);
        this.fontCssLink.href = CssManager.buildLink((customization.aurebeshFont ? 'aurebesh' : 'roboto') + '-condensed', customization.condensedFont);
    }

    private static buildLink(name: string, on: boolean): string {
        return '/css/' + name + '-' + (on ? 'on' : 'off') + '.css';
    }
}
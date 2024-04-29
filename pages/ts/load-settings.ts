import { Auth, CssManager, CssSettings } from "./utils.js";

export async function loadSettings(): Promise<void> {
    const cssManager = new CssManager();

    await Auth.validateToken();
    
    cssManager.applyStyle(await CssSettings.get());
}
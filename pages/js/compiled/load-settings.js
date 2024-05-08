import { Auth, CssManager, Customization } from "./utils.js";
export async function loadSettings() {
    const cssManager = new CssManager();
    await Auth.validateToken();
    const cssSettings = await Customization.get();
    cssManager.applyStyle(cssSettings);
    cssSettings.cache();
}

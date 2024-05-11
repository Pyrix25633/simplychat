import { Auth, CssManager, Customization } from "./utils.js";
export async function loadCustomization() {
    const cssManager = new CssManager();
    await Auth.validateToken();
    const customization = await Customization.get();
    cssManager.applyStyle(customization);
    customization.cache();
}

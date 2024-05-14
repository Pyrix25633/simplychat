import { Auth, CssManager, Customization } from "./utils.js";

export async function loadCustomization(): Promise<Customization> {
    const cssManager = new CssManager();

    await Auth.validateToken();

    const customization = await Customization.get();
    
    cssManager.applyStyle(customization);
    customization.cache();
    return customization;
}
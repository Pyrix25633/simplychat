import { Input } from "./form.js";

export class NameInput extends Input<string> {
    constructor() {
        super('name', 'text', 'Name:', 'Input Chat Name');
    }

    async parse(): Promise<string | undefined> {
        const name = this.getInputValue();
        if(name == this.precompiledValue) {
            this.precompile(name);
            return name;
        }
        if(name.length < 3) {
            this.setError(true, 'Chat Name too short!');
            return undefined;
        }
        if(name.length > 64) {
            this.setError(true, 'Chat Name too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Name');
        return name;
    }
}

export class DescriptionInput extends Input<string> {
    constructor() {
        super('description', 'text', 'Description:', 'Input Chat Description');
    }

    async parse(): Promise<string | undefined> {
        const description = this.getInputValue();
        if(description == this.precompiledValue) {
            this.precompile(description);
            return description;
        }
        if(description.length < 3) {
            this.setError(true, 'Chat Description too short!');
            return undefined;
        }
        if(description.length > 128) {
            this.setError(true, 'Chat Description too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Description');
        return description;
    }
}
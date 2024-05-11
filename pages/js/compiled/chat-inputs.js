import { Input } from "./form.js";
export class NameInput extends Input {
    constructor() {
        super('name', 'text', 'Name:', 'Input Chat Name');
    }
    async parse() {
        const status = this.getInputValue();
        if (status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
        if (status.length < 3) {
            this.setError(true, 'Chat Name too short!');
            return undefined;
        }
        if (status.length > 64) {
            this.setError(true, 'Chat Name too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Name');
        return status;
    }
}
export class DescriptionInput extends Input {
    constructor() {
        super('description', 'text', 'Description:', 'Input Chat Description');
    }
    async parse() {
        const status = this.getInputValue();
        if (status == this.precompiledValue) {
            this.precompile(status);
            return status;
        }
        if (status.length < 3) {
            this.setError(true, 'Chat Description too short!');
            return undefined;
        }
        if (status.length > 128) {
            this.setError(true, 'Chat Description too long!');
            return undefined;
        }
        this.setError(false, 'Valid Chat Description');
        return status;
    }
}

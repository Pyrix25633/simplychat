import { RequireNonNull } from "./utils.js";
const codeMessageHeading = RequireNonNull.getElementById('code-message');
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const message = params.get('message');
if (code != null && message != null)
    codeMessageHeading.innerText = code + ': ' + message;

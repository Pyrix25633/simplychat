import { loadCustomization } from "./load-customization.js";
import { Auth, RequireNonNull } from "./utils.js";
class StatusDiv {
    constructor() {
        this.span = document.createElement('span');
        this.span.classList.add('error');
        this.img = document.createElement('img');
        this.img.classList.add('status', 'error');
        const div = RequireNonNull.getElementById('status');
        div.appendChild(this.span);
        div.appendChild(this.img);
    }
    setOnline(online) {
        if (online) {
            this.span.classList.replace('error', 'success');
            this.img.classList.replace('error', 'success');
        }
        else {
            this.span.classList.replace('success', 'error');
            this.img.classList.replace('success', 'error');
        }
        this.span.innerText = online ? 'Online' : 'Offline';
        this.img.src = '/img/' + (online ? 'online' : 'offline') + '.svg';
    }
}
const statusDiv = new StatusDiv();
const customization = await loadCustomization();
const socket = io();
socket.on('connect', (data) => {
    socket.emit('connect-status', { auth: Auth.getCookie() });
    statusDiv.setOnline(true);
});
socket.on('disconnect', (data) => {
    statusDiv.setOnline(false);
});

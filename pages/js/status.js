import { loadSettings, cachedLogin } from "./load-settings.js";

const statusH3 = document.getElementById('status');
const statusImg = document.getElementById('status-img');
const cpuCanvas = document.getElementById('cpu');

const socket = io();
socket.on('connect', () => {
    statusH3.classList.replace('error', 'success');
    statusH3.innerText = 'Online';
    statusImg.src = './img/online.svg';
    socket.emit('connect-status', cachedLogin);
});
socket.on('disconnect', () => {
    statusH3.classList.replace('success', 'error');
    statusH3.innerText = 'Offline';
    statusImg.src = './img/offline.svg';
});
socket.on('status-short', (data) => {
});

loadSettings(() => {});

new Chart(cpuCanvas, {
    type: 'line',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
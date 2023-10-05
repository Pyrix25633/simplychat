import { loadSettings, cachedLogin } from "./load-settings.js";

const statusH3 = document.getElementById('status');
const statusImg = document.getElementById('status-img');
const cpuCanvas = document.getElementById('cpu');
const ramSwapCanvas = document.getElementById('ram-swap');
const usersCanvas = document.getElementById('users');
const chatsCanvas = document.getElementById('chats');

const percentageSettings = {
    type: 'line',
    data: {
        labels: ['1m', '54s', '48s', '42s', '36s', '30s', '24s', '18s', '12s', '6s', 'now']
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: 100
            }
        }
    }
};
const genericSettings = {
    type: 'line',
    data: {
        labels: ['10m', '9m', '8m', '7m', '6m', '5m', '4m', '3m', '2m', '1m', 'now']
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
};
const datasetSettings = {
    borderWidth: 1,
    pointStyle: false,
    tension: 0.3
};
const cpuSettings = JSON.parse(JSON.stringify(percentageSettings));
const cpuDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
cpuDatasetSettings.label = 'CPU',
cpuDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
cpuDatasetSettings.borderColor = '#409AAF';
cpuSettings.data.datasets = [cpuDatasetSettings];
const ramSwapSettings = JSON.parse(JSON.stringify(percentageSettings));
const ramDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
ramDatasetSettings.label = 'RAM',
ramDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
ramDatasetSettings.borderColor = '#409AAF';
const swapDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
swapDatasetSettings.label = 'SWAP',
swapDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
swapDatasetSettings.borderColor = '#F3E63D';
ramSwapSettings.data.datasets = [ramDatasetSettings, swapDatasetSettings];
const usersSettings = JSON.parse(JSON.stringify(genericSettings));
const usersDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
usersDatasetSettings.label = 'Users',
usersDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
usersDatasetSettings.borderColor = '#409AAF';
const onlineDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
onlineDatasetSettings.label = 'Online',
onlineDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
onlineDatasetSettings.borderColor = '#71E0AE';
usersSettings.data.datasets = [usersDatasetSettings, onlineDatasetSettings];
const chatsSettings = JSON.parse(JSON.stringify(genericSettings));
const chatsDatasetSettings = JSON.parse(JSON.stringify(datasetSettings));
chatsDatasetSettings.label = 'Chats',
chatsDatasetSettings.data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
chatsDatasetSettings.borderColor = '#409AAF';
chatsSettings.data.datasets = [chatsDatasetSettings];

loadSettings((settings) => {
    Chart.defaults.backgroundColor = '#222222';
    Chart.defaults.borderColor = '#333333';
    Chart.defaults.color = '#DDDDDD';
    let font;
    if(settings.aurebeshFont) {
        if(settings.condensedFont)
            font = "'Aurebesh Condensed', sans-serif";
        else
            font = "'Aurebesh', sans-serif";
    }
    else {
        if(settings.condensedFont)
            font = "'Roboto Condensed', sans-serif";
        else
            font = "'Roboto Mono', monospace";
    }
    Chart.defaults.font.family = font;
    const cpuChart = new Chart(cpuCanvas, cpuSettings);
    const ramSwapChart = new Chart(ramSwapCanvas, ramSwapSettings);
    const usersChart = new Chart(usersCanvas, usersSettings);
    const chatsChart = new Chart(chatsCanvas, chatsSettings);
    const socket = io();
    socket.on('connect', () => {
        socket.emit('connect-status', cachedLogin);
        statusH3.classList.replace('error', 'success');
        statusH3.innerText = 'Online';
        statusImg.src = './img/online.svg';
    });
    socket.on('disconnect', () => {
        statusH3.classList.replace('success', 'error');
        statusH3.innerText = 'Offline';
        statusImg.src = './img/offline.svg';
    });
    socket.on('status-short-old', (data) => {
        for(const short of data.short) {
            cpuChart.data.datasets[0].data.push(short.cpu);
            cpuChart.data.datasets[0].data.splice(0, 1);
            ramSwapChart.data.datasets[0].data.push(short.ram);
            ramSwapChart.data.datasets[0].data.splice(0, 1);
            ramSwapChart.data.datasets[1].data.push(short.swap);
            ramSwapChart.data.datasets[1].data.splice(0, 1);
        }
        cpuChart.update('none');
        ramSwapChart.update('none');
    });
    socket.on('status-long-old', (data) => {
        for(const long of data.long) {
            usersChart.data.datasets[0].data.push(long.users);
            usersChart.data.datasets[0].data.splice(0, 1);
            usersChart.data.datasets[1].data.push(long.online);
            usersChart.data.datasets[1].data.splice(0, 1);
            chatsChart.data.datasets[0].data.push(long.chats);
            chatsChart.data.datasets[0].data.splice(0, 1);
        }
        usersChart.update('none');
        chatsChart.update('none');
    });
    socket.on('status-short', (data) => {
        cpuChart.data.datasets[0].data.push(data.cpu);
        cpuChart.data.datasets[0].data.splice(0, 1);
        ramSwapChart.data.datasets[0].data.push(data.ram);
        ramSwapChart.data.datasets[0].data.splice(0, 1);
        ramSwapChart.data.datasets[1].data.push(data.swap);
        ramSwapChart.data.datasets[1].data.splice(0, 1);
        cpuChart.update('none');
        ramSwapChart.update('none');
    });
    socket.on('status-long', (data) => {
        usersChart.data.datasets[0].data.push(data.users);
        usersChart.data.datasets[0].data.splice(0, 1);
        usersChart.data.datasets[1].data.push(data.online);
        usersChart.data.datasets[1].data.splice(0, 1);
        chatsChart.data.datasets[0].data.push(data.chats);
        chatsChart.data.datasets[0].data.splice(0, 1);
        usersChart.update('none');
        chatsChart.update('none');
    });
}, true);
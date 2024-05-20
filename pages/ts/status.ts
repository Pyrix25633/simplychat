import { loadCustomization } from "./load-customization.js";
import { Auth, RequireNonNull } from "./utils.js";

declare function io(): Socket;
type Event = 'status-resources' | 'status-resources-old' | 'status-database' | 'status-database-old' | 'connect' | 'disconnect';
type Data = { [index: string]: any; };
type Socket = {
    on(event: Event, callback: (data: Data) => void ): void;
    emit(event: 'connect-status', data: Data): void;
};
type ChartData = {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor: string;
        borderWidth: number;
        pointStyle: boolean;
        tension: number;
    }[];
};
type ChartSettings = {
    type: string;
    data: ChartData;
    options: {
        scales: {
            y: {
                beginAtZero: boolean;
                suggestedMax?: number;
            };
        };
    };
};
declare class Chart {
    public static readonly defaults: {
        backgroundColor: string;
        borderColor: string;
        color: string;
        font: {
            family: string;
        };
    };
    public readonly data: ChartData;

    constructor(canvas: HTMLCanvasElement, settings: ChartSettings);

    update(s: string): void;
};

class StatusDiv {
    private readonly h3: HTMLHeadingElement;
    private readonly img: HTMLImageElement;

    constructor() {
        this.h3 = document.createElement('h3');
        this.h3.classList.add('error');
        this.img = document.createElement('img');
        this.img.classList.add('status', 'error');
        const div = RequireNonNull.getElementById('status');
        div.appendChild(this.h3);
        div.appendChild(this.img);
    }

    setOnline(online: boolean): void {
        if(online) {
            this.h3.classList.replace('error', 'success');
            this.img.classList.replace('error', 'success');
        }
        else {
            this.h3.classList.replace('success', 'error');
            this.img.classList.replace('success', 'error');
        }
        this.h3.innerText = online ? 'Online' : 'Offline';
        this.img.src = '/img/' + (online ? 'online' : 'offline') + '.svg';
    }
}

class ChartCanvas {
    protected readonly chart: Chart;

    constructor(id: string, type: 'resources' | 'database', firstDatasetLabel: string,
                secondDatasetLabel: string | undefined = undefined, secondDatasetColor: string | undefined = undefined) {
        const labels = [];
        if(type == 'resources') {
            labels.push('1m');
            for(let i = 9; i > 0; i--)
                labels.push((i * 6) + 's');
        }
        else {
            for(let i = 10; i > 0; i--)
                labels.push(i + 'm');
        }
        const firstDatasetData = [];
        for(let i = 0; i < 11; i++)
            firstDatasetData.push(0);
        const settings: ChartSettings = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: firstDatasetLabel,
                        data: firstDatasetData,
                        borderColor: '#409AAF',
                        borderWidth: 1,
                        pointStyle: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        };
        if(type == 'resources')
            settings.options.scales.y.suggestedMax = 100;
        if(secondDatasetLabel != undefined && secondDatasetColor != undefined) {
            const secondDatasetData = [];
            for(let i = 0; i < 11; i++)
                secondDatasetData.push(0);
            settings.data.datasets.push({
                label: secondDatasetLabel,
                data: secondDatasetData,
                borderColor: secondDatasetColor,
                borderWidth: 1,
                pointStyle: false,
                tension: 0.3
            });
        }
        this.chart = new Chart(RequireNonNull.getElementById(id) as HTMLCanvasElement, settings);
    }

    push(newData: number, dataset: number = 0) {
        const data = this.chart.data.datasets[dataset].data;
        data.shift();
        data.push(newData);
    }

    update() {
        this.chart.update('none');
    }
}

const statusDiv = new StatusDiv();
const customization = await loadCustomization();
const socket = io();

Chart.defaults.backgroundColor = '#222222';
Chart.defaults.borderColor = '#333333';
Chart.defaults.color = '#DDDDDD';
Chart.defaults.font.family = customization.aurebeshFont ?
'\'Aurebesh ' + (customization.condensedFont ? 'Condensed' : '') + '\', sans-serif' :
'\'Roboto ' + (customization.condensedFont ? 'Condensed\', sans-serif' : 'Mono\', monospace');

const cpuChart = new ChartCanvas('cpu', 'resources', 'CPU');
const ramSwapChart = new ChartCanvas('ram-swap', 'resources', 'RAM', 'SWAP', '#F3E63D');
const usersChart = new ChartCanvas('users', 'database', 'Users', 'Online', '#71E0AE');
const chatsChart = new ChartCanvas('chats', 'database', 'Chats');

function pushResources(data: Data): void {
    cpuChart.push(data.cpu);
    ramSwapChart.push(data.ram);
    ramSwapChart.push(data.swap, 1);
    cpuChart.update();
    ramSwapChart.update();
}

function pushDatabase(data: Data): void {
    usersChart.push(data.users);
    usersChart.push(data.online, 1);
    chatsChart.push(data.chats);
    usersChart.update();
    chatsChart.update();
}

socket.on('connect', (data: Data): void => {
    socket.emit('connect-status', { auth: Auth.getCookie() });
    statusDiv.setOnline(true);
});
socket.on('status-resources', pushResources);
socket.on('status-database', pushDatabase);
socket.on('status-resources-old', (data: Data): void => {
    for(const d of data.resources)
        pushResources(d);
});
socket.on('status-database-old', (data: Data): void => {
    for(const d of data.database)
        pushDatabase(d);
});
socket.on('disconnect', (data: Data): void => {
    statusDiv.setOnline(false);
});
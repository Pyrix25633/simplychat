import * as fs from 'fs';

function generateRandomColor(): string {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function generateRandomPfp(id: number): void {
    let svg: string = '<svg xmlns="http://www.w3.org/2000/svg" height="9" width="9">';
    const color: string = generateRandomColor();
    for(let x = 1; x < 5; x++) {
        for(let y = 1; y < 8; y++) {
            if(Math.random() < 0.5) {
                svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '" />';
                if(x != 4)
                    svg += '<rect x="' + (8 - x) + '" y="' + y + '" width="1"  height="1" fill="' + color + '" />';
            }
        }
    }
    svg += '</svg>';
    fs.writeFileSync('./pfps/' + id + '.svg', svg);
}

export function generateRandomChatLogo(id: number): void {
    let svg: string = '<svg xmlns="http://www.w3.org/2000/svg" height="9" width="9">';
    const color: string = generateRandomColor();
    for(let y = 1; y < 5; y++) {
        for(let x = 1; x < 8; x++) {
            if(Math.random() < 0.5) {
                svg += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '" />';
                if(y != 4)
                    svg += '<rect x="' + x + '" y="' + (8 - y) + '" width="1"  height="1" fill="' + color + '" />';
            }
        }
    }
    svg += '</svg>';
    fs.writeFileSync('./chatLogos/' + id + '.svg', svg);
}
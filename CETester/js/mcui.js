const mcColor = {
    "black":"#000",
    "dark_blue":"#0000aa",
    "dark_green":"#00aa00",
    "dark_aqua":"#00aaaa",
    "dark_red":"#aa0000",
    "dark_purple":"#aa00aa",
    "gold":"#ffaa00",
    "gray":"#aaaaaa",
    "dark_gray":"#555555",
    "blue":"#5555ff",
    "green":"#55ff55",
    "aqua":"#55ffff",
    "red":"#ff5555",
    "light_purple":"#ff55ff",
    "yellow":"#ffff55",
    "white":"#ffffff"
};
function formatText(data) {
    if (!data) return "";
    if (typeof data === 'string') {
        return formatLore(data);
    }
    if (Array.isArray(data)) {
        return data.map(part => {
            if (typeof part === 'string') return formatLore(part);
            
            let html = "";
            const color = part.color ? (mcColor[part.color] || part.color) : null;
            
            if (color) html += `<span style="color:${color}">`;
            if (part.bold) html += "<b>";
            if (part.italic) html += "<i>";
            if (part.underlined) html += "<u>";
            if (part.strikethrough) html += "<s>";
            if (part.obfuscated) html += '<span class="obfuscated">';
            
            html += part.text || "";
            
            if (part.obfuscated) html += '</span>';
            if (part.strikethrough) html += "</s>";
            if (part.underlined) html += "</u>";
            if (part.italic) html += "</i>";
            if (part.bold) html += "</b>";
            if (color) html += "</span>";
            
            return html;
        }).join('');
    }
    
    return String(data);
}
function parseGradient(text) {
    if (typeof text !== 'string') return text;
    
    const gradientRegex = /<gradient:(#[0-9A-Fa-f]{6}):(#[0-9A-Fa-f]{6})>([^<]+)/g;
    
    return text.replace(gradientRegex, (match, color1, color2, content) => {
        return `<span style="background: linear-gradient(to right, ${color1}, ${color2}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; display: inline-block;">${content}</span>`;
    });
}
function parseSingleColor(text) {
    if (typeof text !== 'string') return text;
    
    const colorRegex = /<color:(#[0-9A-Fa-f]{6})>([^<]+)/g;
    return text.replace(colorRegex, (match, color, content) => {
        return `<span style="color:${color}">${content}</span>`;
    });
}
function formatLore(line) {
    if (!line) return "";
    line = parseGradient(line);
    line = parseSingleColor(line);
    let html = "";
    let i = 0;
    
    while (i < line.length) {
        if (line[i] === '&' && i + 1 < line.length) {
            const code = line[i + 1].toLowerCase();
            const colorMap = {
                "0": "black", "1": "dark_blue", "2": "dark_green", "3": "dark_aqua",
                "4": "dark_red", "5": "dark_purple", "6": "gold", "7": "gray",
                "8": "dark_gray", "9": "blue", "a": "green", "b": "aqua",
                "c": "red", "d": "light_purple", "e": "yellow", "f": "white"
            };
            
            if (code in colorMap) {
                html += `<span style="color:${mcColor[colorMap[code]]}">`;
                i += 2;
                continue;
            }
            if (code === 'l') { html += "<b>"; i += 2; continue; }
            if (code === 'o') { html += "<i>"; i += 2; continue; }
            if (code === 'n') { html += "<u>"; i += 2; continue; }
            if (code === 'm') { html += "<s>"; i += 2; continue; }
            if (code === 'k') { html += '<span class="obfuscated">'; i += 2; continue; }
            if (code === 'r') {
                html += "</span></span></span></span></span></span>";
                i += 2;
                continue;
            }
        }
        
        html += line[i];
        i++;
    }
    
    return html + "</span>";
}

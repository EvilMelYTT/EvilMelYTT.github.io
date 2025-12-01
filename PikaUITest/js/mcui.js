// Simple MC-style color codes to HTML
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

// Converts your NBT-like JSON -> HTML tooltip text
function formatLore(line) {
    if (!line) return "";

    // Convert &color to span
    return line.replace(/&([0-9a-f])/g, (match, code) => {
        const map = {
            "0": "black",
            "1": "dark_blue",
            "2": "dark_green",
            "3": "dark_aqua",
            "4": "dark_red",
            "5": "dark_purple",
            "6": "gold",
            "7": "gray",
            "8": "dark_gray",
            "9": "blue",
            "a": "green",
            "b": "aqua",
            "c": "red",
            "d": "light_purple",
            "e": "yellow",
            "f": "white"
        };
        return `<span style="color:${mcColor[map[code]]}">`;
    }) + "</span>";
}

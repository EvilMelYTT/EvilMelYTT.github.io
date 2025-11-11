// ==UserScript==
// @name         Chunkbase F3+C Input Parser (Updated 2025 Fix)
// @namespace    chunkybasey
// @version      1.4
// @description  Adds F3+C paste box that auto-fills X/Z on Chunkbase Seed Map (compatible with 2025 layout)
// @match        https://www.chunkbase.com/apps/seed-map*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const waitForInputs = setInterval(() => {
        const xInput = document.querySelector('#x-input, #map-goto-x, input[name="x"]');
        const zInput = document.querySelector('#z-input, #map-goto-z, input[name="z"]');

        if (xInput && zInput) {
            clearInterval(waitForInputs);

            const parent = xInput.closest('form, .input-group, .controls, .fancy-row') || xInput.parentElement;

            const f3Label = document.createElement('label');
            f3Label.setAttribute('for', 'f3c-input');
            f3Label.textContent = 'F3+C: ';
            f3Label.style.marginLeft = '6px';
            f3Label.style.fontSize = '13px';

            const f3Input = document.createElement('input');
            f3Input.type = 'text';
            f3Input.placeholder = '/execute in minecraft:overworld run tp @s 123 64 456';
            f3Input.className = 'mini';
            f3Input.id = 'f3c-input';
            f3Input.style.width = '220px';
            f3Input.style.marginLeft = '4px';

            const netherToggle = document.createElement('label');
            netherToggle.innerHTML = '<input type="checkbox" id="nether-toggle"> Nether → Overworld';
            netherToggle.style.marginLeft = '10px';
            netherToggle.style.fontSize = '12px';

            parent.appendChild(f3Label);
            parent.appendChild(f3Input);
            parent.appendChild(netherToggle);

            f3Input.addEventListener('input', () => {
                const text = f3Input.value.trim();
                const isNether = text.includes('minecraft:the_nether');
                const shouldConvert = document.querySelector('#nether-toggle')?.checked;

                const regex = /tp @s (-?\d+(?:\.\d+)?) [-\d.]+ (-?\d+(?:\.\d+)?)/;
                const match = text.match(regex);

                if (match) {
                    let x = Math.trunc(parseFloat(match[1]));
                    let z = Math.trunc(parseFloat(match[2]));

                    if (isNether && shouldConvert) {
                        x *= 8;
                        z *= 8;
                    }

                    xInput.value = x;
                    zInput.value = z;

                    xInput.dispatchEvent(new Event('input', { bubbles: true }));
                    zInput.dispatchEvent(new Event('input', { bubbles: true }));

                    f3Input.style.borderColor = '#4caf50';
                } else {
                    f3Input.style.borderColor = '#f44336';
                }
            });
        }
    }, 400);
})();

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('bg-settings-btn');
    const menu = document.getElementById('bg-settings-menu');
    const bgSelect = document.getElementById('bg-select');
    const customUrlInput = document.getElementById('bg-custom-url');
    const brightnessSlider = document.getElementById('bg-brightness');
    
    // Preset background URL
    const presetUrl = 'https://i.imgur.com/vah5Ugs.png';
    
    // Current background state
    let currentBg = {
        type: 'none',
        url: '',
        brightness: 1
    };

    // Load saved settings from localStorage
    loadSettings();

    if (!btn || !menu) return;

    // Toggle menu visibility
    btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        menu.classList.toggle('hidden');
    });

    menu.addEventListener('click', (ev) => ev.stopPropagation());

    document.addEventListener('click', () => menu.classList.add('hidden'));

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') menu.classList.add('hidden');
    });

    // Handle background type selection
    bgSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        currentBg.type = type;
        
        // Show/hide custom URL input
        customUrlInput.style.display = type === 'custom' ? 'block' : 'none';
        
        // Apply background based on selection
        applyBackground();
    });

    // Handle custom URL input
    customUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            currentBg.url = customUrlInput.value.trim();
            applyBackground();
        }
    });

    // Handle brightness changes
    brightnessSlider.addEventListener('input', (e) => {
        currentBg.brightness = parseFloat(e.target.value);
        applyBackground();
    });

    function applyBackground() {
        let bgElement = document.getElementById('background-overlay');
        
        // Create overlay if it doesn't exist
        if (!bgElement) {
            bgElement = document.createElement('div');
            bgElement.id = 'background-overlay';
            bgElement.style.position = 'fixed';
            bgElement.style.top = '0';
            bgElement.style.left = '0';
            bgElement.style.width = '100%';
            bgElement.style.height = '100%';
            bgElement.style.zIndex = '-1';
            document.body.appendChild(bgElement);
        }
        
        // Apply background based on type
        switch(currentBg.type) {
            case 'none':
                bgElement.style.backgroundImage = 'none';
                break;
            case 'preset':
                bgElement.style.backgroundImage = `url('${presetUrl}')`;
                break;
            case 'custom':
                if (currentBg.url) {
                    bgElement.style.backgroundImage = `url('${currentBg.url}')`;
                }
                break;
        }
        
        // Apply brightness/opacity
        bgElement.style.opacity = currentBg.brightness.toString();
        
        // Save settings
        saveSettings();
    }

    function saveSettings() {
        localStorage.setItem('bgSettings', JSON.stringify(currentBg));
    }

    function loadSettings() {
        const saved = localStorage.getItem('bgSettings');
        if (saved) {
            currentBg = JSON.parse(saved);
            
            // Update UI to match saved settings
            bgSelect.value = currentBg.type;
            customUrlInput.value = currentBg.type === 'custom' ? currentBg.url : '';
            customUrlInput.style.display = currentBg.type === 'custom' ? 'block' : 'none';
            brightnessSlider.value = currentBg.brightness;
            
            // Apply saved background
            applyBackground();
        }
    }
});
let currentPage = 1;
let pages = {};
let originalEnchantmentOrder = null;
let isCurrentlySorted = false;
let currentFilterDisplay = 'All'; 
let currentMenu = 'enchantments'; 
let easterEggActive = false;
let rngData = null;
let easterEggSlots = [13, 14, 15, 22, 23, 24, 31, 32, 33];
const TOTAL_PAGES = 4;

const imageUrlCache = new Map();

fetch("items.json")
  .then(r => r.json())
  .then(data => { pages = data; renderInventory(currentPage); });

async function getItemImage(item) {
    let id_clean = (item.icon || item.id || "").replace("minecraft:","").trim().replace(/["'}]/g,"");
    if(!id_clean) return "";

    const baseUrl = "https://assets.mcasset.cloud/1.21.10/assets/minecraft/textures/";

    const texturePaths = [
        `item/${id_clean}.png`,
        `block/${id_clean}.png`, 
        `item/${id_clean}.png`,
    ];

    if(id_clean === "compass") {
        return `${baseUrl}item/compass_19.png`;
    }
    if(id_clean === "crossbow") {
        return `${baseUrl}item/crossbow_standby.png`;
    }
    if(id_clean.includes("glass")) {
        let color = id_clean.split("_")[0] || "gray";
        return `${baseUrl}block/${color}_stained_glass.png`;
    }

    for (const texturePath of texturePaths) {
        const fullUrl = baseUrl + texturePath;
        if (imageUrlCache.has(fullUrl)) {
            const cachedResult = imageUrlCache.get(fullUrl);
            if (cachedResult.exists) {
                return fullUrl;
            }
        }
    }

    for (const texturePath of texturePaths) {
        const fullUrl = baseUrl + texturePath;
        try {
            const exists = await checkImageExists(fullUrl);
            imageUrlCache.set(fullUrl, { exists: exists });
            if (exists) {
                return fullUrl;
            }
        } catch (error) {
            console.warn(`Error checking image ${fullUrl}:`, error);
            imageUrlCache.set(fullUrl, { exists: false });
        }
    }

    if (id_clean.includes('_door') || id_clean.includes('_trapdoor') || 
        id_clean.includes('_sign') || id_clean.includes('_hanging_sign')) {
        return `${baseUrl}item/${id_clean}.png`;
    }

    return `${baseUrl}item/${id_clean}.png`;
}

function checkImageExists(url) {
    return new Promise((resolve) => {
        if (imageUrlCache.has(url)) {
            resolve(imageUrlCache.get(url).exists);
            return;
        }

        const img = new Image();
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                imageUrlCache.set(url, { exists: false });
                resolve(false);
            }
        }, 2000);

        img.onload = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                imageUrlCache.set(url, { exists: true });
                resolve(true);
            }
        };

        img.onerror = function() {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                imageUrlCache.set(url, { exists: false });
                resolve(false);
            }
        };

        img.src = url;
    });
}
function cycleFilterDisplay() {
    const filterCycle = ['All', 'Armor', 'Tool', 'Weapon', 'Ranged'];
    const loreCycle = ['Armor', 'Tool', 'Weapon', 'Ranged', 'All'];

    const currentIndex = filterCycle.indexOf(currentFilterDisplay);
    const nextIndex = (currentIndex + 1) % filterCycle.length;

    currentFilterDisplay = filterCycle[nextIndex];
    const nextLore = loreCycle[nextIndex];

    pages.forEach(page => {
        const filterItem = page.items.find(it => it.slot === 5 && it.id === 'minecraft:comparator');
        if (filterItem) {
            filterItem.name_raw = `&fCurrently viewing: &f${currentFilterDisplay} enchants`;
            filterItem.lore = [`&e► Click to view &f${nextLore}&e enchants`];
        }
    });

    applyCurrentFilter();
    renderInventory(currentPage); 
    updateDebugInfo(`🔍 Filter applied: ${currentFilterDisplay}`);
}
function applyCurrentFilter() {
    const enchantmentSlots = [12,13,14,15,16,21,22,23,24,25,30,31,32,33,34];

    if (currentFilterDisplay === 'All') {

        if (isCurrentlySorted && originalEnchantmentOrder) {
            restoreOriginalOrder();
        }

        return;
    }

    if (!originalEnchantmentOrder) {
        originalEnchantmentOrder = {};
        pages.forEach(page => {
            originalEnchantmentOrder[page.page] = {};
            enchantmentSlots.forEach(slotIndex => {
                const item = page.items.find(it => it.slot === slotIndex);
                if (item && item.id) {
                    originalEnchantmentOrder[page.page][slotIndex] = {...item};
                }
            });
        });
    }

    pages.forEach(page => {
        enchantmentSlots.forEach(slotIndex => {
            const existingItem = page.items.find(it => it.slot === slotIndex);
            if (existingItem) {
                existingItem.id = '';
                existingItem.name_raw = '';
                existingItem.lore = [];
                existingItem.icon = '';
            }
        });
    });

    let filteredEnchantments = [];

    Object.keys(originalEnchantmentOrder).forEach(pageNum => {
        const pageItems = originalEnchantmentOrder[pageNum];
        Object.keys(pageItems).forEach(slotIndex => {
            const originalItem = pageItems[slotIndex];
            if (matchesFilter(originalItem, currentFilterDisplay)) {

                let cleanName = '';
                if (isCurrentlySorted) {
                    if (typeof originalItem.name_raw === 'string') {
                        cleanName = originalItem.name_raw.replace(/&[0-9a-fk-or]/g, '').replace(/<[^>]*>/g, '');
                    } else if (Array.isArray(originalItem.name_raw)) {
                        cleanName = originalItem.name_raw.map(part => {
                            if (typeof part === 'object' && part.text) return part.text;
                            return String(part);
                        }).join('').replace(/&[0-9a-fk-or]/g, '').replace(/<[^>]*>/g, '');
                    }
                }

                filteredEnchantments.push({
                    ...originalItem,
                    cleanName: cleanName.toLowerCase().trim(),
                    originalPage: parseInt(pageNum),
                    originalSlot: parseInt(slotIndex)
                });
            }
        });
    });

    if (isCurrentlySorted) {
        filteredEnchantments.sort((a, b) => a.cleanName.localeCompare(b.cleanName));
    }

    filteredEnchantments.forEach((enchantment, index) => {
        if (index < enchantmentSlots.length * TOTAL_PAGES) {
            const targetSlot = enchantmentSlots[index % enchantmentSlots.length];
            const targetPage = Math.floor(index / enchantmentSlots.length) + 1;

            if (targetPage <= TOTAL_PAGES && pages[targetPage - 1]) {
                let targetItem = pages[targetPage - 1].items.find(it => it.slot === targetSlot);
                if (!targetItem) {
                    targetItem = {
                        slot: targetSlot
                    };
                    pages[targetPage - 1].items.push(targetItem);
                }

                Object.assign(targetItem, {
                    id: enchantment.id,
                    count: enchantment.count || 1,
                    name_raw: enchantment.name_raw,
                    lore: enchantment.lore || [],
                    icon: getFilteredIcon(enchantment, currentFilterDisplay)
                });
            }
        }
    });
}
function matchesFilter(item, filter) {
    if (filter === 'All') return true;

    const loreText = Array.isArray(item.lore) ? item.lore.join(' ') : '';
    const nameText = typeof item.name_raw === 'string' ? item.name_raw : '';
    const combinedText = (loreText + ' ' + nameText).toLowerCase();

    switch(filter) {
        case 'Armor':
            return item.id.includes('helmet') || 
                   item.id.includes('chestplate') || 
                   item.id.includes('leggings') || 
                   item.id.includes('boots') ||
                   loreText.includes('Armor');

        case 'Tool':

            const isChopper = combinedText.includes('chopper') || combinedText.includes('25% chance to drop double logs');
            return item.id.includes('diamond_hoe') || 
                   (item.id.includes('diamond_axe') && isChopper) ||
                   loreText.includes('Tools') ||
                   isChopper;

        case 'Weapon':

            const weaponEnchants = ['uppercut', 'militia', 'heart stealer', 'bloodlust', 'bash', 'stormhailer', 'crimson', 'disarmor', 'meltdown'];
            return item.id.includes('diamond_sword') || 
                   weaponEnchants.some(ench => combinedText.includes(ench)) ||
                   loreText.includes('Weapon');

        case 'Ranged':
            return item.id.includes('bow') || 
                   item.id.includes('crossbow') || 
                   item.id.includes('trident') ||
                   loreText.includes('Bow') ||
                   loreText.includes('Crossbow') ||
                   loreText.includes('Trident');

        default:
            return true;
    }
}


function getFilteredIcon(item, filter) {
    if (filter === 'All') return item.icon;

    const loreText = Array.isArray(item.lore) ? item.lore.join(' ') : '';
    const nameText = typeof item.name_raw === 'string' ? item.name_raw : '';
    const combinedText = (loreText + ' ' + nameText).toLowerCase();

    switch(filter) {
        case 'Tool':

            if (combinedText.includes('chopper') || combinedText.includes('25% chance to drop double logs')) {
                return 'minecraft:diamond_axe';
            }
            break;

        case 'Weapon':

            const weaponEnchants = ['uppercut', 'militia', 'heart stealer', 'bloodlust', 'bash', 'stormhailer', 'crimson', 'disarmor', 'meltdown'];
            if (weaponEnchants.some(ench => combinedText.includes(ench))) {
                return 'minecraft:netherite_sword';
            }
            break;
    }

    return item.icon; 
}

function handleItemClick(item, slotIndex) {
    if (!item || !item.name_raw) return;
    if (handleEasterEgg(item, slotIndex)) return;
    let rawName = '';
    if (typeof item.name_raw === 'string') {
        rawName = item.name_raw.replace(/&[0-9a-fk-or]/g, '').toLowerCase();
    } else if (Array.isArray(item.name_raw)) {
        rawName = item.name_raw.map(part => {
            if (typeof part === 'object' && part.text) return part.text;
            return String(part);
        }).join('').toLowerCase();
    }
    if (slotIndex === 0 && rawName.includes('ᴇɴᴄʜᴀɴᴛᴍᴇɴᴛ ꜱʜᴏᴘ')) {
        switchMenu('enchantment_shop');
        return;
    }
    if (slotIndex === 18 && rawName.includes('ɪᴛᴇᴍ ʀᴇᴘᴀɪʀᴇʀ')) {
        switchMenu('item_repairer');
        return;
    }
    if (slotIndex === 27 && rawName.includes('ɪᴛᴇᴍ ᴛɪɴᴋᴇʀᴇʀ')) {
        switchMenu('item_tinkerer');
        return;
    }
    if (slotIndex === 36 && rawName.includes('ɪᴛᴇᴍ ᴄᴏᴍʙɪɴᴇʀ')) {
        switchMenu('item_combiner');
        return;
    }
    if (slotIndex === 45 && rawName.includes('ʙᴏᴏꜱᴛᴇʀꜱ')) {
        switchMenu('boosters');
        return;
    }    

    if (rawName.includes('next page') && rawName.includes('▶')) {
        currentPage = currentPage % TOTAL_PAGES + 1;
        renderInventory(currentPage);
        return;
    }
if (slotIndex === 53 && (rawName.includes('ꜱᴡɪᴛᴄʜ ᴍᴇɴᴜꜱ') || rawName.includes('compass'))) {
    switchMenu('items'); 
    return;
}
if (slotIndex === 9 && (rawName.includes('ᴇɴᴄʜᴀɴᴛᴍᴇɴᴛꜱ') || rawName.includes('book'))) {
    switchMenu('items'); 
    return;
}
    if (rawName.includes('previous page') && rawName.includes('◀')) {
        currentPage = currentPage - 1;
        if (currentPage < 1) currentPage = TOTAL_PAGES;
        renderInventory(currentPage);
        return;
    }

    if (item.id === 'minecraft:comparator' && slotIndex === 5) {
        cycleFilterDisplay();
        return;
    }

    if (item.id === 'minecraft:comparator' && slotIndex === 50) {
        sortEnchantments();
        return;
    }
}
function switchMenu(menuName) {
    currentMenu = menuName;
    currentPage = 1;
    currentFilterDisplay = 'All';
    isCurrentlySorted = false;
    originalEnchantmentOrder = null; 
    
    // ✅ Reset Easter egg when switching menus
    if (menuName !== 'ce' && menuName !== 'ce2') {
        easterEggActive = false;
        rngData = null;
    }

    fetch(`${menuName}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`Failed to load ${menuName}.json`);
            return r.json();
        })
        .then(data => { 
            pages = data; 
            renderInventory(currentPage);
            updateDebugInfo(`📁 Switched to ${menuName.replace('_', ' ')} menu`);
        })
        .catch(error => {
            console.error(`Failed to load ${menuName}.json:`, error);
            if (menuName !== 'items') {
                fetch("items.json")
                    .then(r => r.json())
                    .then(data => { 
                        pages = data; 
                        renderInventory(currentPage);
                        updateDebugInfo('❌ Menu not found, returned to main');
                    });
            }
        });
}

function restoreOriginalOrder() {
    const enchantmentSlots = [12,13,14,15,16,21,22,23,24,25,30,31,32,33,34];

    pages.forEach(page => {
        enchantmentSlots.forEach(slotIndex => {
            const existingItem = page.items.find(it => it.slot === slotIndex);
            if (existingItem) {
                existingItem.id = '';
                existingItem.name_raw = '';
                existingItem.lore = [];
                existingItem.icon = '';
            }
        });
    });

    Object.keys(originalEnchantmentOrder).forEach(pageNum => {
        const pageItems = originalEnchantmentOrder[pageNum];
        Object.keys(pageItems).forEach(slotIndex => {
            const originalItem = pageItems[slotIndex];
            const slotNum = parseInt(slotIndex);
            const pageNumInt = parseInt(pageNum);

            if (pages[pageNumInt - 1]) {
                let targetItem = pages[pageNumInt - 1].items.find(it => it.slot === slotNum);
                if (!targetItem) {
                    targetItem = {
                        id: '',
                        count: 1,
                        name_raw: '',
                        lore: [],
                        icon: '',
                        slot: slotNum
                    };
                    pages[pageNumInt - 1].items.push(targetItem);
                }

                Object.assign(targetItem, {...originalItem});
            }
        });
    });

    renderInventory(currentPage);
}

function sortEnchantments() {
    const enchantmentSlots = [12,13,14,15,16,21,22,23,24,25,30,31,32,33,34];

    if (isCurrentlySorted && originalEnchantmentOrder) {
        restoreOriginalOrder();
        applyCurrentFilter(); 
        isCurrentlySorted = false;
        updateSortComparator(false);
        updateDebugInfo('🔁 Restored original enchantment order with filter');
        return;
    }

    if (!originalEnchantmentOrder) {
        originalEnchantmentOrder = {};
        pages.forEach(page => {
            originalEnchantmentOrder[page.page] = {};
            enchantmentSlots.forEach(slotIndex => {
                const item = page.items.find(it => it.slot === slotIndex);
                if (item && item.id) {
                    originalEnchantmentOrder[page.page][slotIndex] = {...item};
                }
            });
        });
    }

    let allEnchantments = [];

    pages.forEach(page => {
        enchantmentSlots.forEach(slotIndex => {
            const item = page.items.find(it => it.slot === slotIndex);
            if (item && item.id && item.name_raw && matchesFilter(item, currentFilterDisplay)) {

                let cleanName = '';
                if (typeof item.name_raw === 'string') {
                    cleanName = item.name_raw.replace(/&[0-9a-fk-or]/g, '').replace(/<[^>]*>/g, '');
                } else if (Array.isArray(item.name_raw)) {
                    cleanName = item.name_raw.map(part => {
                        if (typeof part === 'object' && part.text) {
                            return part.text;
                        }
                        return String(part);
                    }).join('').replace(/&[0-9a-fk-or]/g, '').replace(/<[^>]*>/g, '');
                }

                if (cleanName.trim()) {
                    allEnchantments.push({
                        ...item,
                        cleanName: cleanName.toLowerCase().trim(),
                        originalPage: page.page,
                        originalSlot: slotIndex
                    });
                }
            }
        });
    });

    allEnchantments.sort((a, b) => a.cleanName.localeCompare(b.cleanName));

    pages.forEach(page => {
        enchantmentSlots.forEach(slotIndex => {
            const existingItem = page.items.find(it => it.slot === slotIndex);
            if (existingItem) {
                existingItem.id = '';
                existingItem.name_raw = '';
                existingItem.lore = [];
                existingItem.icon = '';
            }
        });
    });

    allEnchantments.forEach((enchantment, index) => {
        if (index < enchantmentSlots.length * 4) {
            const targetSlot = enchantmentSlots[index % enchantmentSlots.length];
            const targetPage = Math.floor(index / enchantmentSlots.length) + 1;

            if (targetPage <= TOTAL_PAGES) {
                let targetItem = pages[targetPage - 1].items.find(it => it.slot === targetSlot);
                if (!targetItem) {
                    targetItem = {
                        id: '',
                        count: 1,
                        name_raw: '',
                        lore: [],
                        icon: '',
                        slot: targetSlot
                    };
                    pages[targetPage - 1].items.push(targetItem);
                }

                Object.assign(targetItem, {
                    id: enchantment.id,
                    count: enchantment.count,
                    name_raw: enchantment.name_raw,
                    lore: enchantment.lore,
                    icon: enchantment.icon,
                    slot: targetSlot
                });
            }
        }
    });

    isCurrentlySorted = true;
    updateSortComparator(true);
    updateDebugInfo(`✅ ${currentFilterDisplay} enchantments sorted alphabetically`);
}
function updateSortComparator(isSorted) {
    if (isSorted) {

        pages.forEach(page => {
            const sortItem = page.items.find(it => 
                it.slot === 50 && it.id === 'minecraft:comparator'
            );
            if (sortItem && sortItem.name_raw.includes('Sort Enchantments')) {
                sortItem.lore = [
                    "Currently Viewing: Alphabetical Order",
                    "&e&lClick to sort by &f&lDefault &e&lOrder"
                ];
            }
        });
    } else {

        pages.forEach(page => {
            const sortItem = page.items.find(it => 
                it.slot === 50 && it.id === 'minecraft:comparator'
            );
            if (sortItem && sortItem.name_raw.includes('Sort Enchantments')) {
                sortItem.lore = [
                    "Currently Viewing: Default Order", 
                    "&e&lClick to sort by &f&lAlphabetical &e&lOrder"
                ];
            }
        });
    }
    renderInventory(currentPage);
}
function updateDebugInfo(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function updateItemImage(slot, item) {
    const itemDiv = slot.querySelector('.mcui-item');
    itemDiv.innerHTML = '';

    if (item && item.id) {
        getItemImage(item).then(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = item.id;
            img.onerror = function() {
                console.warn(`Failed to load image: ${imageUrl}`);
                this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj4/PC90ZXh0Pgo8L3N2Zz4K';
            };
            itemDiv.appendChild(img);
        }).catch(error => {
            console.error('Error getting item image:', error);
            const img = document.createElement('img');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNjY2Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5FcnJvcjwvdGV4dD4KPC9zdmc+Cg==';
            itemDiv.appendChild(img);
        });
    }
}

function renderRichText(components) {
    if (!components || !Array.isArray(components)) return "";

    return components.map(component => {
        if (typeof component === 'string') {
            return `<span>${component}</span>`;
        }

        let style = "";
        const color = component.color || "white";
        style += `color: ${mcColor[color] || "#FFFFFF"};`;
        if (component.bold) style += "font-weight: bold;";
        if (component.italic) style += "font-style: italic;";
        if (component.underlined) style += "text-decoration: underline;";
        if (component.strikethrough) style += "text-decoration: line-through;";
        if (component.obfuscated) style += "filter: blur(1px);";

        return `<span style="${style}">${component.text || ""}</span>`;
    }).join("");
}
function handleEasterEgg(item, slotIndex) {
    // Only work in enchantment_shop and ce2 menus
    if (currentMenu !== 'enchantment_shop' && currentMenu !== 'ce2') return false;
    
    let rawName = '';
    if (typeof item.name_raw === 'string') {
        // Remove color codes but keep the original case and Unicode characters
        rawName = item.name_raw.replace(/&[0-9a-fk-or]/g, '');
    } else if (Array.isArray(item.name_raw)) {
        rawName = item.name_raw.map(part => {
            if (typeof part === 'object' && part.text) return part.text;
            return String(part);
        }).join('').replace(/&[0-9a-fk-or]/g, '');
    }

    console.log('Easter egg check:', {
        menu: currentMenu,
        slot: slotIndex,
        rawName: rawName,
        itemName: item.name_raw
    });
    
    // Check if this is a "purchase random enchantment" button in enchantment_shop
    if (currentMenu === 'enchantment_shop' && rawName === 'ᴘᴜʀᴄʜᴀꜱᴇ ʀᴀɴᴅᴏᴍ ᴇɴᴄʜᴀɴᴛᴍᴇɴᴛ') {
        console.log('Starting easter egg sequence...');
        startEasterEggSequence();
        return true;
    }
    
    // Check if this is a "click here to reveal enchantment" button in ce2
    if (currentMenu === 'ce2' && rawName === 'Click here to reveal enchantment') {
        console.log('Revealing random enchantment for slot', slotIndex);
        revealRandomEnchantment(slotIndex);
        return true;
    }
if (currentMenu === 'ce2' && rawName === 'ɢᴏ ᴀɢᴀɪɴ?') {
    console.log('Restarting easter egg sequence...');
    startEasterEggSequence();
    return true;
}

if (currentMenu === 'ce2' && rawName === 'ᴅᴏɴᴇ ɢᴀᴍʙʟɪɴɢ?') {
    console.log('Returning to main menu...');
    switchMenu('items');
    return true;
}
    return false;
}
function startEasterEggSequence() {
    updateDebugInfo('🎲 Starting easter egg sequence...');
    
    // Load ce.json first
    fetch("ce.json")
        .then(r => {
            if (!r.ok) throw new Error('Failed to load ce.json');
            return r.json();
        })
        .then(data => {
            pages = data;
            currentMenu = 'ce'; // Important: update current menu
            renderInventory(currentPage);
            updateDebugInfo('🔮 Loading mystery interface...');
            
            // Pre-load rng data while showing ce.json
            loadRngData();
            
            // After 2 seconds, transition to ce2.json
            setTimeout(() => {
                transitionToCe2();
            }, 2000);
        })
        .catch(error => {
            console.error('Failed to load ce.json:', error);
            updateDebugInfo('❌ Failed to load mystery interface');
        });
}
function transitionToCe2() {
    fetch("ce2.json")
        .then(r => {
            if (!r.ok) throw new Error('Failed to load ce2.json');
            return r.json();
        })
        .then(data => {
            pages = data;
            currentMenu = 'ce2'; // Important: update current menu
            // Inject random enchants into the slots
            loadRandomEnchantsIntoCe2();
            renderInventory(currentPage);
            updateDebugInfo('🎯 Select an enchantment to reveal!');
        })
        .catch(error => {
            console.error('Failed to load ce2.json:', error);
            updateDebugInfo('❌ Failed to load enchantment selection');
        });
}
// In your ce.json file, add this auto-transition logic
// This should be in the ce.json loading section
function handleCeJsonLoad() {
    // Wait 2 seconds then load ce2.json
    setTimeout(() => {
        fetch("ce2.json")
            .then(r => r.json())
            .then(data => {
                pages = data;
                // Now inject random enchants from rng.json
                loadRandomEnchantsIntoCe2();
                renderInventory(currentPage);
                updateDebugInfo('🔄 Auto-transitioned to enchantment selection');
            })
            .catch(error => {
                console.error('Failed to load ce2.json:', error);
            });
    }, 2000);
}
function loadRandomEnchantsIntoCe2() {
    console.log('Loading random enchants into ce2...');
    
    if (!rngData || !rngData.enchantments) {
        console.error('No RNG data loaded for ce2');
        updateDebugInfo('❌ No RNG data loaded');
        return;
    }
    
    // Define which slots should get the reveal books in ce2
    // UPDATE THESE SLOT NUMBERS to match your actual ce2.json slots
    const revealSlots = [12, 13, 14, 21, 22, 23, 30, 31, 32]; // Example slots
    
    console.log('Setting up reveal slots:', revealSlots);
    
    // Set up the reveal buttons
    pages.forEach(page => {
        revealSlots.forEach(slotIndex => {
            let item = page.items.find(it => it.slot === slotIndex);
            if (!item) {
                item = { slot: slotIndex };
                page.items.push(item);
            }
            
            // Set up as clickable reveal button
            Object.assign(item, {
                id: 'minecraft:enchanted_book',
                name_raw: '&l&dClick here to reveal enchantment',
                lore: ['&7Click to discover a random enchantment!'],
                icon: 'minecraft:enchanted_book',
                count: 1
            });
            
            console.log('Set up reveal button in slot:', slotIndex);
        });
    });
    
    console.log('Reveal buttons setup complete');
}
// Function to load the custom enchant data from rng.json
function loadRngData() {
    fetch("rng.json")
        .then(r => {
            if (!r.ok) throw new Error('Failed to load rng.json');
            return r.json();
        })
        .then(data => {
            rngData = data;
            updateDebugInfo(`📚 Loaded ${data.enchantments ? data.enchantments.length : 0} random enchantments`);
        })
        .catch(error => {
            console.error('Failed to load rng.json:', error);
            updateDebugInfo('❌ Failed to load enchantment database');
        });
}

function revealRandomEnchantment(slotIndex) {
    console.log('revealRandomEnchantment called for slot:', slotIndex);
    console.log('RNG Data available:', !!rngData);
    console.log('Enchantments available:', rngData?.enchantments?.length);
    
    if (!rngData || !rngData.enchantments || rngData.enchantments.length === 0) {
        console.error('No RNG data or enchantments available');
        updateDebugInfo('❌ No enchantments available to reveal');
        return;
    }
    
    // Get a random enchantment
    const randomIndex = Math.floor(Math.random() * rngData.enchantments.length);
    const randomEnchant = rngData.enchantments[randomIndex];
    
    console.log('Selected enchantment:', randomEnchant);
    
    // Update the specific slot that was clicked
    let updated = false;
    pages.forEach(page => {
        const item = page.items.find(it => it.slot === slotIndex);
        if (item) {
            console.log('Updating item in slot', slotIndex, 'with:', randomEnchant);
            Object.assign(item, {
                id: randomEnchant.id || 'minecraft:enchanted_book',
                name_raw: randomEnchant.name_raw || '&c&lUnknown Enchantment',
                lore: randomEnchant.lore || ['&7Failed to load enchantment data'],
                icon: randomEnchant.icon || 'minecraft:enchanted_book',
                count: randomEnchant.count || 1
            });
            updated = true;
        }
    });
    
    if (updated) {
        renderInventory(currentPage);
        const cleanName = randomEnchant.name_raw ? randomEnchant.name_raw.replace(/&[0-9a-fk-or]/g, '') : 'Unknown Enchantment';
        updateDebugInfo(`🎁 Revealed: ${cleanName}`);
        console.log('Enchantment revealed successfully:', cleanName);
    } else {
        console.error('Could not find item in slot:', slotIndex);
        updateDebugInfo('❌ Failed to reveal enchantment');
    }
}

// Updated function to show random custom enchant from rng.json
function showRandomCustomEnchant(clickedSlot) {
    if (!rngData || !rngData.enchantments || rngData.enchantments.length === 0) {
        updateDebugInfo('❌ No RNG enchantments loaded');
        return;
    }
    
    // Get a random enchantment from rng.json
    const randomEnchant = rngData.enchantments[Math.floor(Math.random() * rngData.enchantments.length)];
    
    // Update the center slot (slot 23) with the random enchant
    pages.forEach(page => {
        const centerItem = page.items.find(it => it.slot === 23);
        if (centerItem) {
            Object.assign(centerItem, {
                id: randomEnchant.id || 'minecraft:enchanted_book',
                name_raw: randomEnchant.name_raw || '&d&lMystery Enchant',
                lore: randomEnchant.lore || ['&7A mysterious power...'],
                icon: randomEnchant.icon || 'minecraft:enchanted_book',
                count: randomEnchant.count || 1
            });
        }
        
        // Reset the clicked purple glass (optional - keep it purple or reset to green)
        const clickedItem = page.items.find(it => it.slot === clickedSlot);
        if (clickedItem && clickedSlot !== 23) {
            // Keep it purple for continued use, or reset to green:
            // clickedItem.id = 'minecraft:green_stained_glass_pane';
            // clickedItem.name_raw = '&a&l??? &2Secret Pattern';
            // clickedItem.lore = ['&7Complete the pattern to', '&7unlock hidden enchantments!'];
            // clickedItem.icon = 'minecraft:green_stained_glass_pane';
        }
    });
    
    renderInventory(currentPage);
    updateDebugInfo(`🎲 Revealed: ${randomEnchant.name_raw ? randomEnchant.name_raw.replace(/&[0-9a-fk-or]/g, '') : 'Mystery Enchant'}`);
}

// Reset function remains the same but also clears rngData
function resetEasterEgg() {
    easterEggActive = false;
    rngData = null;
    
    pages.forEach(page => {
        easterEggSlots.forEach(slotIndex => {
            const item = page.items.find(it => it.slot === slotIndex);
            if (item) {
                item.id = 'minecraft:green_stained_glass_pane';
                item.name_raw = '&a&l??? &2Secret Pattern';
                item.lore = [
                    '&7Complete the pattern to',
                    '&7unlock hidden enchantments!'
                ];
                item.icon = 'minecraft:green_stained_glass_pane';
            }
        });
    });
    
    renderInventory(currentPage);
    updateDebugInfo('🔄 Easter egg reset - pattern ready again');
}
const tooltip = document.createElement("div");
tooltip.className = "mcui-tooltip";
document.body.appendChild(tooltip);

function showTooltip(e, item){
    if(!item) return;
    let html = "";

    if(item.name_raw && Array.isArray(item.name_raw)){
        html += renderRichText(item.name_raw) + "<br>";
    } else if (item.name_raw && typeof item.name_raw === 'string') {
        html += formatText(item.name_raw) + "<br>";
    }

    if(item.lore && item.lore.length > 0){
        for(let loreLine of item.lore){
            if(Array.isArray(loreLine)){
                html += renderRichText(loreLine) + "<br>";
            } else if(loreLine && typeof loreLine === 'string') {
                html += formatText(loreLine) + "<br>";
            }
        }
    }

    tooltip.innerHTML = html;
    tooltip.style.display = "block";
}

function hideTooltip(){ 
    tooltip.style.display="none"; 
}

document.addEventListener("mousemove",e=>{ 
    tooltip.style.left=(e.pageX+20)+"px"; 
    tooltip.style.top=(e.pageY+20)+"px"; 
});

function renderInventory(pageNum){
    const inv = document.getElementById("inventory");
    inv.innerHTML = "";
    const pageObj = pages.find(p => p.page === pageNum);
    if (!pageObj) return;
    const items = pageObj.items;
    if (!items) return;

    const grid = document.createElement("div");
    grid.className = "inventory-grid";

    for(let i = 0; i < 54; i++){
        const slot = document.createElement("div");
        slot.className = "slot";
        const item = items.find(it => it.slot === i);

        const icon = document.createElement("div");
        icon.className = "mcui-item";
        slot.appendChild(icon);

        if(item && item.id){

            updateItemImage(slot, item);

            slot.addEventListener("mouseenter", e => showTooltip(e, item));
            slot.addEventListener("mouseleave", hideTooltip);
            slot.addEventListener("click", () => {
                handleItemClick(item, i);
            });

            if(item.icon === "arrow"){
                slot.style.cursor = "pointer";
            }
        }
        grid.appendChild(slot);
    }
    inv.appendChild(grid);
}


function formatText(text) {
    if (typeof text !== 'string') return '';

    text = text.replace(/<gradient:(#[0-9A-Fa-f]{6}):(#[0-9A-Fa-f]{6})>(.*?)<\/gradient>/g, 
        (match, start, end, content) => {
            let result = '';
            for (let i = 0; i < content.length; i++) {
                const t = i / (content.length - 1 || 1);
                const color = interpolateColor(start, end, t);
                result += `<span style="color:${color}">${content[i]}</span>`;
            }
            return result;
        });

    const colors = {
        '0':'#000000','1':'#0000AA','2':'#00AA00','3':'#00AAAA','4':'#AA0000','5':'#AA00AA',
        '6':'#FFAA00','7':'#AAAAAA','8':'#555555','9':'#5555FF','a':'#55FF55','b':'#55FFFF',
        'c':'#FF5555','d':'#FF55FF','e':'#FFFF55','f':'#FFFFFF'
    };

    text = text.replace(/&/g, '§');
    let output = '';
    let currentColor = '#FFFFFF';
    let bold = false, italic = false, underlined = false, strikethrough = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '§' && i + 1 < text.length) {
            const code = text[++i].toLowerCase();
            switch (code) {
                case 'l': bold = true; break;
                case 'o': italic = true; break;
                case 'n': underlined = true; break;
                case 'm': strikethrough = true; break;
                case 'r': 
                    bold = italic = underlined = strikethrough = false;
                    currentColor = '#FFFFFF';
                    break;
                default:
                    if (colors[code]) {
                        currentColor = colors[code];
                        bold = italic = underlined = strikethrough = false;
                    }
            }
        } else {
            let style = `color:${currentColor};`;
            if (bold) style += 'font-weight:bold;';
            if (italic) style += 'font-style:italic;';
            if (underlined) style += 'text-decoration:underline;';
            if (strikethrough) style += 'text-decoration:line-through;';
            output += `<span style="${style}">${text[i]}</span>`;
        }
    }

    return output;
}

function interpolateColor(color1, color2, factor) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);

    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const imageUrls = [
    "https://i.ibb.co/N6hR3P81/sample-d398025e6c04ee30429e1aa49c2a48a475752081.jpg",
    "https://i.ibb.co/PsJ7ZBQh/sample-637e037f0253d655d8116b71512e178c1c8ec823.jpg",
    "https://i.ibb.co/ZCHgHFn/sample-414dbad77d063a984a2c64cea54273277d0970fd.jpg",
    "https://i.ibb.co/sdkCDzFD/q9pok1limzv71.jpg",
    "https://i.ibb.co/4ZFV2SV5/oreimo-05-2.jpg",
    "https://i.ibb.co/MdPFJgd/kuroneko-ruri.gif",
    "https://i.ibb.co/x8Mhv8sS/kuroneko-didnt-deserve-that-ending-v0-pn2m5d4f6lbf1.jpg",
    "https://i.ibb.co/Q7cqWsSz/Kuroneko-in-the-arcade-S02-E01-m21-s31.webp",
    "https://i.ibb.co/XrZ630Vy/Kuroneko-Appearance.webp",
    "https://i.ibb.co/RGSc7nXc/kasseus-maximus-kuroneko-layingdown-resize-fix.jpg",
    "https://i.ibb.co/5xXkmLGs/117988529-p0.jpg",
    "https://i.ibb.co/XnvK64v/ef66df23956ceda5762bdc0b48fcc2bc.jpg",
    "https://i.ibb.co/wFgBLx13/bd4d27e3d8d050221eca8695e843972e.jpg",
    "https://i.ibb.co/67k24mWF/131823071-p0.jpg",
    "https://i.ibb.co/5X7jwKXY/21452704-p0.jpg",
    "https://i.ibb.co/FbDV1wN0/648192.jpg",
    "https://i.ibb.co/Kpw1f5Mv/837959.jpg",
    "https://i.ibb.co/h1gzfhtB/4655c053ac6eeb378f5453f10ba2867cb89875c3.jpg",
    "https://i.ibb.co/HT9p16d3/1200x675.jpg",
    "https://i.ibb.co/Wv54x8q9/638b30d6051911412d93e758f6a2b4cf.jpg",
    "https://i.ibb.co/v4P3rzMp/40e1479e6e648546e85b7b981bf2d7941c5d3794.jpg",
    "https://i.ibb.co/WN5jZtbD/35f2bf27262890758652a1e57b278f4b7a2cefb5.jpg",
    "https://i.ibb.co/CScrQrN/7a866da2acc24a449b1081135f81c9b1.gif",
    "https://i.ibb.co/TDrGDqGD/3f87e8714c97fe48839335db1aac629e.gif",
    "https://i.ibb.co/G4knK5vx/122004950-p0-min.jpg",
    "https://i.ibb.co/nF7NHmy/122004950-p0-master1200.webp",
    "https://i.ibb.co/Tq4YnSkn/129488328-p0-master1200.webp",
    "https://i.ibb.co/Xxr3b1hh/96811374-p0.jpg",
    "https://i.ibb.co/cSfyyJqj/15172211-p0-master1200.webp",
    "https://i.ibb.co/7N1qrbHL/47730149-p0-master1200.webp",
    "https://i.ibb.co/xKfZTPrd/60498994-p0.png",
    "https://i.ibb.co/k22sc1x0/107649822-p0-master1200.webp",
    "https://i.ibb.co/hJQ49LB2/107649822-p13-master1200.webp",
    "https://i.ibb.co/HDqDXDTr/107649822-p14-master1200.webp",
    "https://i.ibb.co/Ldwh3VT5/127951315-p0-master1200.webp",
    "https://i.ibb.co/kgtHzb30/79995854-p0-master1200.webp",
    "https://i.ibb.co/6cDLMZPP/15888063-p0-master1200.webp",
    "https://i.ibb.co/jPSpgR6F/84907932-p0-master1200.webp",
    "https://i.ibb.co/fYvmskGh/107335998-p0-master1200.webp",
    "https://i.ibb.co/1GQ4LXJt/14897039-p0-master1200.webp",
    "https://i.ibb.co/W4dTXmC4/17642471-p0-master1200.webp",
    "https://i.ibb.co/Y4nskHnV/46328969-p0-master1200.webp",
    "https://i.ibb.co/rGd9JKQS/35971343-p0-master1200.webp",
    "https://i.ibb.co/4RFwmww4/19537991-p0-master1200.webp",
    "https://i.ibb.co/xtZF47tV/13630562-p0-master1200.webp",
    "https://i.ibb.co/S4g6Thyb/15412556-p0-master1200.webp",
    "https://i.ibb.co/b5Dd60y7/14051428-p0-master1200.webp",
    "https://i.ibb.co/NgVmnKw9/82133500-p0-master1200.webp",
    "https://i.ibb.co/bR82bP5K/98001962-p0-master1200.webp",
    "https://i.ibb.co/TB1dZZBj/29587986-p0-master1200.webp",
    "https://i.ibb.co/zh6Cd8bb/97764598-p0-master1200.webp",
    "https://i.ibb.co/LzmM0tv3/95857567-p0-master1200.webp",
    "https://i.ibb.co/7JtmKdyj/54115101-p0.jpg",
    "https://i.ibb.co/FL1LHM9w/19462688-p0-master1200.webp",
    "https://i.ibb.co/ZRY1KzJb/117980361-p0-master1200.webp",
    "https://i.ibb.co/tTqmxGN5/26599253-p0.jpg",
    "https://i.ibb.co/DP4RcQDj/86061021-p0-master1200.webp",
    "https://i.ibb.co/CcnDJwF/129530247-p0-master1200.webp",
    "https://i.ibb.co/tMkFj06D/d0a0e22217b548fbab87f2e97cac78fdf2464006-hq.gif",
    "https://i.ibb.co/rKQR4GLK/images-27.jpg",
    "https://i.ibb.co/TBfZXX66/images-28.jpg",
    "https://i.ibb.co/jkCCqMCV/a94487e4f63b3e7f40365392385ad52f.gif",
    "https://i.ibb.co/LzNht9DF/images-29.jpg",
    "https://i.ibb.co/sB9PghL/tumblr-mr9xd31-MCH1s1pzmeo1-400.gif",
    "https://i.ibb.co/R4b6NQPF/tumblr-mpoqt4v04-F1squyp0o1-500.gif",
    "https://i.ibb.co/gFTwcRgH/tumblr-mlbhsr-J2321r6jylpo1-500.gif",
    "https://i.ibb.co/gLrp2HcG/tumblr-mpgo7q-Kqgy1qj9uf7o1-500.gif",
    "https://i.ibb.co/V0XVFJMM/tumblr-mr7yq9ben-P1rhlkj4o1-500.gif",
    "https://i.ibb.co/HfkLQK06/tumblr-mn0d86f-YKg1s8166so1-500.gif",
    "https://i.ibb.co/dwKGTdtx/tumblr-md6rnh6-EQD1rsw0k3o1-500.gif",
    "https://i.ibb.co/fdj9kqR0/kuroneko-crying-kuroneko.gif"
];

const track = document.getElementById("scroller-track");
const loading = document.getElementById("scroller-loading");

// Preload all images
let loaded = 0;
const imgs = [];

function preloadImages(urls, callback) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            loaded++;
            loading.textContent = `Loading all images ᓚᘏᗢ ${Math.round(loaded / urls.length * 100)}%`;
            if (loaded === urls.length) callback();
        };
        imgs.push(img);
    });
}

function startScroller() {
    loading.style.display = "none";

    // Append images to track
    imgs.forEach(img => track.appendChild(img));

    // Duplicate images for infinite scroll
    imgs.forEach(img => {
        const clone = img.cloneNode();
        track.appendChild(clone);
    });

    let scroll = 0;
    function animate() {
        scroll += 0.5; // adjust scroll speed here
        if (scroll >= track.scrollWidth / 2) scroll = 0;
        track.style.transform = `translateX(-${scroll}px)`;
        requestAnimationFrame(animate);
    }
    animate();
}

preloadImages(imageUrls, startScroller);

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
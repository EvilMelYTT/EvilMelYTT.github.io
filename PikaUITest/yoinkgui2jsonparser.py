import json
import tkinter as tk
from tkinter import filedialog, messagebox
import re

def parse_minecraft_json(text):
    """Parse Minecraft JSON text component into rich text format"""
    if not text or text in ['""', "''"]:
        return [{"text": "", "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]
    
    try:
        # Clean the text first - remove any trailing commas or malformed parts
        clean_text = text.strip()
        if clean_text.startswith("'") and clean_text.endswith("'"):
            clean_text = clean_text[1:-1]
        
        # Parse the JSON
        data = json.loads(clean_text)
        return parse_minecraft_component(data)
    except Exception as e:
        print(f"Failed to parse Minecraft JSON: {text[:100]}... Error: {e}")
        return [{"text": text, "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]

def parse_minecraft_component(component):
    """Recursively parse Minecraft text components"""
    if isinstance(component, str):
        return [{"text": component, "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]
    
    if isinstance(component, dict):
        result = []
        
        # Handle the main component
        if "text" in component:
            result.append({
                "text": component.get("text", ""),
                "color": component.get("color"),
                "bold": component.get("bold", False),
                "italic": component.get("italic", False),
                "underlined": component.get("underlined", False),
                "strikethrough": component.get("strikethrough", False),
                "obfuscated": component.get("obfuscated", False)
            })
        
        # Handle extra array
        if "extra" in component and isinstance(component["extra"], list):
            for extra in component["extra"]:
                result.extend(parse_minecraft_component(extra))
        
        return result
    
    if isinstance(component, list):
        result = []
        for item in component:
            result.extend(parse_minecraft_component(item))
        return result
    
    return [{"text": str(component), "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]

def parse_ampersand_codes(text):
    """Convert & codes to rich text format"""
    if not text:
        return [{"text": "", "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]
    
    rich_text = []
    current_color = None
    current_bold = False
    current_italic = False
    current_underlined = False
    current_strikethrough = False
    buffer = ""
    
    i = 0
    while i < len(text):
        if text[i] == '&' and i + 1 < len(text):
            # Save current buffer
            if buffer:
                rich_text.append({
                    "text": buffer,
                    "color": current_color,
                    "bold": current_bold,
                    "italic": current_italic,
                    "underlined": current_underlined,
                    "strikethrough": current_strikethrough,
                    "obfuscated": False
                })
                buffer = ""
            
            # Process the code
            code = text[i + 1].lower()
            color_map = {
                '0': 'black', '1': 'dark_blue', '2': 'dark_green', '3': 'dark_aqua',
                '4': 'dark_red', '5': 'dark_purple', '6': 'gold', '7': 'gray',
                '8': 'dark_gray', '9': 'blue', 'a': 'green', 'b': 'aqua',
                'c': 'red', 'd': 'light_purple', 'e': 'yellow', 'f': 'white'
            }
            
            if code in color_map:
                current_color = color_map[code]
            elif code == 'l':
                current_bold = True
            elif code == 'o':
                current_italic = True
            elif code == 'n':
                current_underlined = True
            elif code == 'm':
                current_strikethrough = True
            elif code == 'r':
                current_color = None
                current_bold = False
                current_italic = False
                current_underlined = False
                current_strikethrough = False
            
            i += 2
        else:
            buffer += text[i]
            i += 1
    
    # Add remaining buffer
    if buffer:
        rich_text.append({
            "text": buffer,
            "color": current_color,
            "bold": current_bold,
            "italic": current_italic,
            "underlined": current_underlined,
            "strikethrough": current_strikethrough,
            "obfuscated": False
        })
    
    return rich_text

# --- Tkinter GUI ---
root = tk.Tk()
root.title("NBT to items.json Converter - 9 Pages")
root.geometry("600x300")

files_to_process = []

def select_files():
    global files_to_process
    files = filedialog.askopenfilenames(
        title="Select NBT TXT files or Editor JSON exports", 
        filetypes=[("Text files","*.txt"), ("JSON files","*.json")]
    )
    files_to_process = list(files)
    file_list_var.set(f"\n".join(files_to_process))
    
    # Show page assignment info
    page_count = min(len(files_to_process), 9)
    page_info = "Page assignments:\n"
    for i in range(page_count):
        category_map = {
            1: 'Main', 2: 'Main', 3: 'Main', 4: 'Main',
            5: 'Weapons', 6: 'Weapons', 7: 'Tools', 8: 'Ranged', 9: 'Armor'
        }
        page_info += f"Page {i+1}: {category_map.get(i+1, 'Main')}\n"
    
    messagebox.showinfo("Files Selected", f"Will create {page_count} pages:\n\n{page_info}")

def convert_and_save():
    if not files_to_process:
        messagebox.showerror("Error", "No files selected")
        return

    all_pages = []
    
    # Define category mapping for pages 1-9
    category_map = {
        1: 'main',
        2: 'main', 
        3: 'main',
        4: 'main',
        5: 'weapon',
        6: 'weapon',
        7: 'tool',
        8: 'ranged', 
        9: 'armor'
    }

    for page_number, file in enumerate(files_to_process, 1):
        if page_number > 9:  # Only process up to 9 files
            break
            
        # Check if file is already a JSON export from the editor
        if file.lower().endswith('.json'):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    json_data = json.load(f)
                
                print(f"Processing JSON file: {file}")
                
                # Handle both single page arrays and full exports
                if isinstance(json_data, list):
                    for page_data in json_data:
                        if 'page' in page_data and 'items' in page_data:
                            # Use the page number from the JSON, or assign sequentially
                            actual_page = page_data.get('page', page_number)
                            if actual_page <= 9:  # Only include if within our 9-page limit
                                all_pages.append({
                                    "page": actual_page,
                                    "category": page_data.get('category', category_map.get(actual_page, 'main')),
                                    "titles": page_data.get('titles', {
                                        'main': f'Main Inventory - Page {actual_page}/9',
                                        'hotbar': f'Categories - Page {actual_page}/9'
                                    }),
                                    "items": page_data['items']
                                })
                                print(f"Added page {actual_page} from JSON export")
                    continue  # Skip NBT processing for JSON files
                else:
                    print(f"Invalid JSON format in {file}")
                    
            except Exception as e:
                print(f"Failed to parse JSON file {file}: {e}")
                # Fall back to NBT processing if JSON fails
                pass

        # Process NBT text files
        print(f"Processing NBT file: {file}")
        items = []
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()
        raw_items = content.split("=== ITEM ")
        
        for raw_item in raw_items[1:]:
            try:
                # Extract ID
                id_line = next(line for line in raw_item.splitlines() if 'id:' in line)
                item_id = id_line.split('id:')[-1].strip().replace('"','').replace('}', '')
                print(f"Processing item: {item_id}")

                # Extract custom_name from Raw NBT
                name_raw = []
                cname_match = re.search(r"minecraft:custom_name':\s*'({.*?})'", raw_item)
                if cname_match:
                    name_json = cname_match.group(1)
                    print(f"Found custom_name: {name_json[:100]}...")
                    name_raw = parse_minecraft_json(name_json)
                else:
                    # Fallback to Name line
                    name_line = next((line for line in raw_item.splitlines() if line.startswith('Name:')), None)
                    if name_line:
                        name_text = name_line.split("Name:")[-1].strip()
                        name_raw = parse_ampersand_codes(name_text)
                    else:
                        name_raw = [{"text": "Unknown", "color": None, "bold": False, "italic": False, "underlined": False, "strikethrough": False, "obfuscated": False}]

                print(f"Parsed name: {[c['text'] for c in name_raw]}")

                # Extract lore
                lore_lines = []
                lore_start = raw_item.find("Lore:")
                if lore_start != -1:
                    lore_content = raw_item[lore_start:].split('\n')
                    for line in lore_content:
                        if line.strip().startswith("Line"):
                            line_text = ":".join(line.split(":")[1:]).strip()
                            if line_text and line_text not in ['""', "''"]:
                                # Try to parse as Minecraft JSON first
                                if line_text.strip().startswith('{'):
                                    lore_line = parse_minecraft_json(line_text)
                                else:
                                    # Parse as & codes
                                    lore_line = parse_ampersand_codes(line_text)
                                lore_lines.append(lore_line)
                
                print(f"Parsed {len(lore_lines)} lore lines")

                items.append({
                    "id": item_id,
                    "count": 1,
                    "name_raw": name_raw,
                    "lore": lore_lines,
                    "icon": item_id,
                    "slot": len(items)  # Auto-assign slots sequentially
                })
                
            except Exception as e:
                print(f"Failed to parse item: {e}")
                import traceback
                traceback.print_exc()

        # Assign the appropriate category based on page number
        category = category_map.get(page_number, 'main')
        
        all_pages.append({
            "page": page_number,
            "category": category,
            "titles": {
                'main': f'Main Inventory - Page {page_number}/9',
                'hotbar': f'Categories - Page {page_number}/9'
            },
            "items": items
        })

    # Sort pages by page number
    all_pages.sort(key=lambda x: x['page'])
    
    save_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files","*.json")])
    if save_path:
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(all_pages, f, indent=2)
        
        # Show summary
        categories_used = {}
        for page in all_pages:
            cat = page['category']
            categories_used[cat] = categories_used.get(cat, 0) + 1
            
        summary = "Export completed!\n\n"
        summary += f"Total pages: {len(all_pages)}\n"
        for cat, count in categories_used.items():
            summary += f"{cat.title()}: {count} page(s)\n"
            
        messagebox.showinfo("Done", f"{summary}\n\nSaved to: {save_path}")

file_list_var = tk.StringVar()
tk.Label(root, text="Select up to 9 files (NBT .txt or Editor .json):", font=("Arial", 10, "bold")).pack(pady=10)
tk.Button(root, text="Select Files", command=select_files, font=("Arial", 10)).pack(pady=5)
tk.Label(root, textvariable=file_list_var, wraplength=550).pack(pady=10)
tk.Button(root, text="Convert & Save as items.json", command=convert_and_save, font=("Arial", 10, "bold"), bg="lightgreen").pack(pady=10)

# Add help text
help_text = """📁 File Types Supported:
• NBT .txt files: Raw Minecraft NBT exports
• Editor .json files: Single pages or multi-page exports from the web editor

📄 Page Assignment:
Pages 1-4: Main Inventory
Pages 5-6: Weapons  
Page 7: Tools
Page 8: Ranged
Page 9: Armor

💡 Tip: You can mix NBT files and Editor JSON exports!"""
tk.Label(root, text=help_text, justify=tk.LEFT, wraplength=550).pack(pady=10)

root.mainloop()
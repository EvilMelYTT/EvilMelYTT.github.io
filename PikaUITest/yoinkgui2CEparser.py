import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json
import re
import os

class SimpleNBTConverterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("NBT to Enchantment Converter")
        self.root.geometry("800x600")
        
        self.all_items = []
        self.selected_enchantments = []
        
        self.create_widgets()
    
    def create_widgets(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill='both', expand=True)
        
        # File selection
        file_frame = ttk.LabelFrame(main_frame, text="File Selection", padding="10")
        file_frame.pack(fill='x', pady=5)
        
        ttk.Label(file_frame, text="Input Files:").grid(row=0, column=0, sticky='w', pady=5)
        self.input_files_listbox = tk.Listbox(file_frame, height=4, selectmode=tk.MULTIPLE)
        self.input_files_listbox.grid(row=0, column=1, columnspan=2, sticky='ew', padx=5, pady=5)
        
        ttk.Button(file_frame, text="Add Files", command=self.add_files).grid(row=0, column=3, padx=5)
        ttk.Button(file_frame, text="Clear Files", command=self.clear_files).grid(row=0, column=4, padx=5)
        
        ttk.Label(file_frame, text="Output File:").grid(row=1, column=0, sticky='w', pady=5)
        self.output_path = tk.StringVar(value="enchantments_output.json")
        ttk.Entry(file_frame, textvariable=self.output_path, width=50).grid(row=1, column=1, columnspan=2, sticky='ew', padx=5)
        ttk.Button(file_frame, text="Browse", command=self.browse_output_file).grid(row=1, column=3, padx=5)
        
        file_frame.columnconfigure(1, weight=1)
        
        # Convert button
        self.convert_btn = ttk.Button(main_frame, text="Convert Files", command=self.convert_files)
        self.convert_btn.pack(pady=10)
        
        # Progress
        self.progress = ttk.Progressbar(main_frame, mode='indeterminate')
        self.progress.pack(fill='x', pady=5)
        
        # Results
        results_frame = ttk.LabelFrame(main_frame, text="Results", padding="10")
        results_frame.pack(fill='both', expand=True, pady=5)
        
        self.results_text = scrolledtext.ScrolledText(results_frame, height=20)
        self.results_text.pack(fill='both', expand=True)
    
    def add_files(self):
        files = filedialog.askopenfilenames(
            title="Select NBT data files",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        for file in files:
            if file not in self.input_files_listbox.get(0, tk.END):
                self.input_files_listbox.insert(tk.END, file)
    
    def clear_files(self):
        self.input_files_listbox.delete(0, tk.END)
    
    def browse_output_file(self):
        filename = filedialog.asksaveasfilename(
            title="Save output JSON file",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if filename:
            self.output_path.set(filename)
    
    def parse_nbt_file_simple(self, file_path):
        """Simple text-based parser that doesn't rely on JSON parsing"""
        items = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split by ITEM sections
            item_sections = re.split(r'=== ITEM \d+ ===', content)
            
            for section in item_sections[1:]:
                item_data = {}
                
                # Extract item ID from Raw NBT
                id_match = re.search(r'id:"([^"]*)"', section)
                if id_match:
                    item_data['id'] = id_match.group(1)
                
                # Extract name from Name line (much more reliable!)
                name_match = re.search(r'Name: ([^\n]+)', section)
                if name_match:
                    item_data['name'] = name_match.group(1).strip()
                
                # Extract lore lines
                lore_lines = []
                lore_section = re.search(r'Lore:(.*?)(?=\n\n|\n===|\n==================================================|\Z)', section, re.DOTALL)
                if lore_section:
                    lore_text = lore_section.group(1)
                    # Extract each lore line
                    for line in lore_text.split('\n'):
                        line = line.strip()
                        if line.startswith('Line '):
                            # Extract the actual lore text after "Line X: "
                            lore_match = re.match(r'Line \d+: (.+)', line)
                            if lore_match:
                                lore_lines.append(lore_match.group(1).strip())
                
                item_data['lore'] = lore_lines
                item_data['file'] = os.path.basename(file_path)
                
                # Only add items that have both name and lore
                if item_data.get('name') and item_data.get('lore'):
                    items.append(item_data)
                    
        except Exception as e:
            print(f"Error parsing file {file_path}: {e}")
        
        return items
    
    def is_custom_enchantment(self, item):
        """STRICT check - only items with exact enchantment pattern in first lore line"""
        if not item.get('lore') or len(item['lore']) == 0:
            return False
        
        first_lore_line = item['lore'][0]
        
        # STRICT PATTERN: Must have BOTH "Common" AND "Enchantment" in first lore line
        # AND must be one of the specific patterns we see in real enchantments
        first_line_clean = first_lore_line.replace('&f', '').replace('&7', '').lower()
        
        # Exact patterns we're looking for:
        exact_patterns = [
            "common refined enchantment",
            "common arcane enchantment"
        ]
        
        # Check if first line matches any of our exact patterns
        for pattern in exact_patterns:
            if pattern in first_line_clean:
                return True
        
        return False
    
    def convert_files(self):
        """Convert all selected files"""
        input_files = self.input_files_listbox.get(0, tk.END)
        output_file = self.output_path.get()
        
        if not input_files:
            messagebox.showerror("Error", "Please select at least one input file")
            return
        
        if not output_file:
            messagebox.showerror("Error", "Please select an output file")
            return
        
        try:
            self.convert_btn.config(state='disabled')
            self.progress.start()
            self.results_text.delete(1.0, tk.END)
            
            # Parse all files
            self.all_items = []
            total_files = len(input_files)
            
            self.results_text.insert(tk.END, f"📁 Processing {total_files} files...\n\n")
            
            for file_path in input_files:
                self.results_text.insert(tk.END, f"Parsing: {os.path.basename(file_path)}... ")
                items = self.parse_nbt_file_simple(file_path)
                self.all_items.extend(items)
                self.results_text.insert(tk.END, f"found {len(items)} items\n")
                self.results_text.update()
            
            self.results_text.insert(tk.END, f"\n✅ Total items parsed: {len(self.all_items)}\n")
            
            # Find custom enchantments with STRICT checking
            enchantments = []
            shop_items = []
            
            for item in self.all_items:
                if self.is_custom_enchantment(item):
                    enchantments.append(item)
                    self.results_text.insert(tk.END, f"✅ ENCHANTMENT: {item['name']} - {item['lore'][0]}\n")
                else:
                    # Track non-enchantment items for debugging
                    if item.get('lore') and len(item['lore']) > 0:
                        shop_items.append(f"{item['name']} - {item['lore'][0]}")
            
            self.results_text.insert(tk.END, f"\n🎯 Total enchantments found: {len(enchantments)}\n")
            
            # Show what was filtered out (for debugging)
            if shop_items and len(enchantments) == 0:
                self.results_text.insert(tk.END, f"\n🔍 Filtered out {len(shop_items)} non-enchantment items. First few:\n")
                for i, item in enumerate(shop_items[:5]):
                    self.results_text.insert(tk.END, f"   {i+1}. {item}\n")
            
            if enchantments:
                # Convert to output format
                output_enchantments = []
                for enchant in enchantments:
                    # Clean up lore - remove empty lines
                    clean_lore = [line for line in enchant['lore'] if line and line != '""']
                    
                    output_enchantments.append({
                        "id": "minecraft:enchanted_book",
                        "name_raw": enchant['name'],
                        "lore": clean_lore,
                        "icon": "minecraft:enchanted_book",
                        "count": 1
                    })
                
                # Save to file
                result = {"enchantments": output_enchantments}
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(result, f, indent=2, ensure_ascii=False)
                
                self.results_text.insert(tk.END, f"\n💾 Saved {len(output_enchantments)} enchantments to:\n{output_file}\n")
                
                # Show summary
                self.results_text.insert(tk.END, "\n📊 Enchantments converted:\n")
                for i, enchant in enumerate(output_enchantments, 1):
                    self.results_text.insert(tk.END, f"  {i}. {enchant['name_raw']}\n")
                
                messagebox.showinfo("Success", f"Converted {len(output_enchantments)} enchantments!\nSaved to: {output_file}")
            else:
                self.results_text.insert(tk.END, "\n❌ No enchantments found!\n")
                self.results_text.insert(tk.END, "Looking for items with 'Common Refined Enchantment' or 'Common Arcane Enchantment' in the FIRST lore line.\n")
                messagebox.showwarning("No Enchantments", "No custom enchantments were found in the selected files.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Conversion failed:\n{str(e)}")
            self.results_text.insert(tk.END, f"❌ Error: {str(e)}")
        
        finally:
            self.progress.stop()
            self.convert_btn.config(state='normal')

def main():
    root = tk.Tk()
    app = SimpleNBTConverterGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
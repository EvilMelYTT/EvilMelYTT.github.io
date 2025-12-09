import re
import tkinter as tk
from tkinter import ttk

# Extracts hex color from any supported format
def extract_hex(s):
    m = re.match(r'&#([0-9a-fA-F]{6})', s)
    if m: return m.group(1)
    m = re.match(r'#([0-9a-fA-F]{6})', s)
    if m: return m.group(1)
    m = re.match(r'&x&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])', s)
    if m: return ''.join(m.groups())
    return None

# Converts hex to EssentialsX
def to_ess(hex_):
    return '&#' + hex_.lower()

# Converts hex to &x format
def to_x(hex_):
    h = hex_.lower()
    return f"&x&{h[0]}&{h[1]}&{h[2]}&{h[3]}&{h[4]}&{h[5]}"

# Main converter
def convert(text, mode):
    out = ""
    i = 0
    while i < len(text):
        sub = text[i:]

        m = re.match(r'#([0-9a-fA-F]{6})', sub)
        if m:
            hex_ = m.group(1)
            if mode == 'A': out += to_ess(hex_)
            else: out += to_x(hex_)
            i += 7
            continue

        m = re.match(r'&#([0-9a-fA-F]{6})', sub)
        if m:
            hex_ = m.group(1)
            if mode == 'A': out += to_ess(hex_)
            else: out += to_x(hex_)
            i += 8
            continue

        m = re.match(r'&x&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])&([0-9a-fA-F])', sub)
        if m:
            hex_ = ''.join(m.groups())
            if mode == 'A': out += to_ess(hex_)
            else: out += to_x(hex_)
            i += len(m.group(0))
            continue

        out += text[i]
        i += 1

    return out

# GUI setup
root = tk.Tk()
root.title("Minecraft Rename Converter")

input_box = tk.Text(root, height=6, width=70)
input_box.pack(padx=10, pady=10)

frame = ttk.Frame(root)
frame.pack()

def do_convert(mode):
    inp = input_box.get("1.0", "end-1c")
    out = convert(inp, mode)
    output_box.delete("1.0", "end")
    output_box.insert("1.0", out)

ttk.Button(frame, text="EssentialsX", command=lambda: do_convert("A")).pack(side="left", padx=5)
ttk.Button(frame, text="&x Format", command=lambda: do_convert("B")).pack(side="left", padx=5)
ttk.Button(frame, text="C1 Mode", command=lambda: do_convert("C")).pack(side="left", padx=5)

output_box = tk.Text(root, height=6, width=70)
output_box.pack(padx=10, pady=10)

root.mainloop()

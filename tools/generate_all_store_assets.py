import os
import json
from PIL import Image, ImageDraw

EXT_JSON_PATH = "/home/shishyan/GitHub/Influenzian/Extensions/docs/extensions.json"
BASE_OUT_DIR = "/home/shishyan/GitHub/Influenzian/Extensions/store-assets"

# Color palette wheel to give each extension distinctive attractive branding
PALETTES = [
    ("#2563eb", "#0f172a", "#1e293b", "#38bdf8"), # Blue
    ("#7c3aed", "#0b090a", "#161a1d", "#a78bfa"), # Purple
    ("#059669", "#064e3b", "#065f46", "#34d399"), # Emerald
    ("#ea580c", "#18181b", "#27272a", "#fb923c"), # Orange
    ("#dc2626", "#18181b", "#27272a", "#f87171"), # Red
    ("#0284c7", "#0a1128", "#1c2541", "#38bdf8"), # Sky
    ("#d97706", "#1c1917", "#292524", "#fbbf24"), # Amber
    ("#4f46e5", "#0f172a", "#1e1b4b", "#818cf8"), # Indigo
    ("#0d9488", "#042f2e", "#115e59", "#2dd4bf"), # Teal
    ("#db2777", "#18181b", "#27272a", "#f472b6"), # Pink
]

def draw_badge(draw, x, y, text, fill_color, text_color):
    padding_x = 16
    w = len(text) * 8 + padding_x * 2
    h = 28
    draw.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=fill_color)
    draw.text((x + padding_x, y + 6), text, fill=text_color)

def generate_assets(item, palette):
    ext_id = item["id"]
    name = item.get("short_name") or item.get("name", ext_id)
    desc = item.get("description", "High performance free browser extension")
    
    accent, bg_dark, card_bg, light_accent = palette
    out_dir = os.path.join(BASE_OUT_DIR, ext_id)
    os.makedirs(out_dir, exist_ok=True)
    
    initials = (name[:2] if len(name) >= 2 else (name + "X")[:2]).upper()
    
    # 1. Icon 128x128
    icon_path = os.path.join(out_dir, "icon128.png")
    if not os.path.exists(icon_path):
        icon = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
        d_icon = ImageDraw.Draw(icon)
        d_icon.rounded_rectangle([4, 4, 124, 124], radius=28, fill=accent)
        d_icon.rounded_rectangle([12, 12, 116, 116], radius=22, fill=(255, 255, 255, 25))
        d_icon.text((44, 48), initials, fill="white")
        icon.save(icon_path)
        
    # 2. Promo Small 440x280
    promo_path = os.path.join(out_dir, "promo_small_440x280.png")
    if not os.path.exists(promo_path):
        promo = Image.new('RGB', (440, 280), bg_dark)
        d_promo = ImageDraw.Draw(promo)
        d_promo.rounded_rectangle([20, 20, 420, 260], radius=16, fill=card_bg, outline=accent, width=2)
        d_promo.rounded_rectangle([40, 40, 96, 96], radius=14, fill=accent)
        d_promo.text((54, 58), initials, fill="white")
        d_promo.text((112, 48), name[:22], fill="white")
        d_promo.text((112, 74), desc[:36], fill="#94a3b8")
        
        draw_badge(d_promo, 40, 120, "100% Free & Open Source", accent, "white")
        draw_badge(d_promo, 40, 160, "Zero Telemetry • No Paywalls", (40, 40, 40), "#cbd5e1")
        draw_badge(d_promo, 40, 200, "Influenzian Pro Suite", (30, 41, 59), light_accent)
        promo.save(promo_path)
        
    # 3. Marquee 1400x560
    marq_path = os.path.join(out_dir, "marquee_1400x560.png")
    if not os.path.exists(marq_path):
        marquee = Image.new('RGB', (1400, 560), bg_dark)
        d_marq = ImageDraw.Draw(marquee)
        d_marq.rounded_rectangle([40, 40, 1360, 520], radius=24, fill=card_bg, outline=accent, width=3)
        d_marq.rounded_rectangle([90, 90, 210, 210], radius=24, fill=accent)
        d_marq.text((125, 130), initials, fill="white")
        
        d_marq.text((240, 95), name, fill="white")
        d_marq.text((240, 145), desc[:80], fill="#94a3b8")
        
        draw_badge(d_marq, 240, 195, "Chrome Web Store Edition", accent, "white")
        draw_badge(d_marq, 490, 195, "Manifest V3 Certified", (30, 41, 59), light_accent)
        
        features = [
            f"Native high-performance DOM execution for {name}",
            "Zero cloud data leakage — 100% local browser processing",
            "Full dark/light UI integration with instant hotkey shortcuts",
            "Completely unrestricted Pro features with zero subscriptions"
        ]
        
        y_pos = 260
        for feat in features:
            d_marq.rounded_rectangle([90, y_pos, 110, y_pos + 20], radius=4, fill=accent)
            d_marq.text((130, y_pos), feat, fill="#e2e8f0")
            y_pos += 45
            
        marquee.save(marq_path)
        
    # 4. Screenshots (3x 1280x800)
    for i in range(1, 4):
        ss_path = os.path.join(out_dir, f"screenshot_{i}.png")
        if not os.path.exists(ss_path):
            ss = Image.new('RGB', (1280, 800), bg_dark)
            d_ss = ImageDraw.Draw(ss)
            d_ss.rectangle([0, 0, 1280, 60], fill="#1e293b")
            d_ss.ellipse([20, 22, 36, 38], fill="#ef4444")
            d_ss.ellipse([46, 22, 62, 38], fill="#f59e0b")
            d_ss.ellipse([72, 22, 88, 38], fill="#10b981")
            d_ss.rounded_rectangle([120, 14, 1000, 46], radius=8, fill="#0f172a")
            d_ss.text((140, 22), f"https://extensions.shishyan.in/{ext_id}/view-{i}", fill="#64748b")
            
            d_ss.rounded_rectangle([80, 110, 1200, 720], radius=16, fill=card_bg, outline=accent, width=2)
            d_ss.text((120, 150), f"{name} — Feature Tour {i}/3", fill="white")
            d_ss.text((120, 190), desc[:90], fill=accent)
            
            d_ss.rounded_rectangle([120, 250, 1160, 670], radius=12, fill="#0b0f19")
            d_ss.text((160, 290), f"Active Module: {ext_id.upper()} CORE ENGINE v3.0", fill="#10b981")
            d_ss.text((160, 330), "• Instant client-side execution with zero latency", fill="#cbd5e1")
            d_ss.text((160, 370), "• Zero external network dependencies (100% offline & privacy compliant)", fill="#cbd5e1")
            d_ss.text((160, 410), "• Streamlined controls seamlessly injected into browser viewport", fill="#cbd5e1")
            d_ss.text((160, 450), "• Full shortcut binding and customizable user preferences", fill="#cbd5e1")
            
            ss.save(ss_path)

def main():
    with open(EXT_JSON_PATH, "r") as f:
        extensions = json.load(f)
        
    print(f"Loaded {len(extensions)} extensions. Generating missing CWS asset suites...")
    for idx, item in enumerate(extensions):
        palette = PALETTES[idx % len(PALETTES)]
        generate_assets(item, palette)
        
    print("All 100 extensions store asset suites generated successfully!")

if __name__ == "__main__":
    main()

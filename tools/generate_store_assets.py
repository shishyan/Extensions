import os
import sys
from PIL import Image, ImageDraw, ImageFont

TOP_EXTENSIONS = [
    {
        "id": "sponsorblock",
        "name": "SponsorBlock for YouTube",
        "subtitle": "Skip sponsor segments, intros & reminders",
        "accent": "#cc0000",
        "bg_dark": "#0f0f0f",
        "card_bg": "#1e1e1e",
        "features": [
            "Auto-skip sponsored segments & shoutouts",
            "Skip intro animations, endcards & recaps",
            "Real-time sponsor segment submitter HUD",
            "Zero tracking & 100% privacy-first"
        ]
    },
    {
        "id": "videospeed",
        "name": "Video Speed Controller Pro",
        "subtitle": "0.1x to 16x custom playback speeds",
        "accent": "#00b4d8",
        "bg_dark": "#0a1128",
        "card_bg": "#1c2541",
        "features": [
            "Precision 0.05x increment speed tuning",
            "Custom keybindings (S, D, Z, X, R, V)",
            "Audio pitch correction & boost mode",
            "Works across all HTML5 video & audio players"
        ]
    },
    {
        "id": "darkzen",
        "name": "DarkZen OLED Dark Mode",
        "subtitle": "Ultra-smooth OLED dark reader everywhere",
        "accent": "#7c3aed",
        "bg_dark": "#0b090a",
        "card_bg": "#161a1d",
        "features": [
            "True pitch-black OLED dark themes",
            "Eye-strain blue light warmer slider",
            "Per-site custom brightness & contrast",
            "Instant zero-flicker CSS engine"
        ]
    },
    {
        "id": "onetab",
        "name": "OneTab Session Pro",
        "subtitle": "Save 95% memory & organize tab groups",
        "accent": "#059669",
        "bg_dark": "#064e3b",
        "card_bg": "#065f46",
        "features": [
            "1-click collapse all tabs into organized list",
            "Restore individual tabs or complete groups",
            "Export/Import URLs as Markdown & JSON",
            "Reduces Chrome memory consumption instantly"
        ]
    },
    {
        "id": "ublockshield",
        "name": "UBlock Shield Cosmetic",
        "subtitle": "Zaps cookie-walls, popups & annoying banners",
        "accent": "#dc2626",
        "bg_dark": "#18181b",
        "card_bg": "#27272a",
        "features": [
            "Right-click element zapper & picker",
            "Bypasses intrusive cookie consent banners",
            "Blocks anti-adblock modals & overlay nags",
            "Zero performance overhead"
        ]
    },
    {
        "id": "honeycoupon",
        "name": "HoneyCoupon Auto-Saver",
        "subtitle": "Auto-test verified discount codes at checkout",
        "accent": "#f59e0b",
        "bg_dark": "#1c1917",
        "card_bg": "#292524",
        "features": [
            "Automatic 1-click checkout coupon tester",
            "Crowdsourced valid promo code directory",
            "Instant savings comparison & alerts",
            "Zero affiliate hijack or data tracking"
        ]
    },
    {
        "id": "keepprice",
        "name": "KeepPrice Amazon Tracker",
        "subtitle": "Interactive price history graphs & drop alerts",
        "accent": "#ea580c",
        "bg_dark": "#18181b",
        "card_bg": "#27272a",
        "features": [
            "Historical Amazon lowest price charts",
            "Target price drop notification triggers",
            "Lightning deal & coupon badge detection",
            "Embeds seamlessly into product detail pages"
        ]
    },
    {
        "id": "loomrecord",
        "name": "LoomRecord Screen Studio",
        "subtitle": "Screen, camera bubble & mic recorder",
        "accent": "#6366f1",
        "bg_dark": "#0f172a",
        "card_bg": "#1e293b",
        "features": [
            "Circular draggable webcam overlay bubble",
            "System audio + microphone narration mixing",
            "Instant WebM / MP4 local export",
            "No 5-minute video duration limits"
        ]
    }
]

def draw_badge(draw, x, y, text, fill_color, text_color):
    padding_x = 16
    padding_y = 8
    w = len(text) * 8 + padding_x * 2
    h = 28
    draw.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=fill_color)
    draw.text((x + padding_x, y + 6), text, fill=text_color)

def generate_assets_for_ext(ext, base_dir):
    out_dir = os.path.join(base_dir, ext["id"])
    os.makedirs(out_dir, exist_ok=True)
    
    # 1. Icon 128x128
    icon = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    d_icon = ImageDraw.Draw(icon)
    d_icon.rounded_rectangle([4, 4, 124, 124], radius=28, fill=ext["accent"])
    d_icon.rounded_rectangle([12, 12, 116, 116], radius=22, fill=(255, 255, 255, 25))
    initials = ext["name"][:2].upper()
    d_icon.text((44, 48), initials, fill="white")
    icon.save(os.path.join(out_dir, "icon128.png"))
    
    # 2. Promo Small 440x280
    promo = Image.new('RGB', (440, 280), ext["bg_dark"])
    d_promo = ImageDraw.Draw(promo)
    d_promo.rounded_rectangle([20, 20, 420, 260], radius=16, fill=ext["card_bg"], outline=ext["accent"], width=2)
    d_promo.rounded_rectangle([40, 40, 96, 96], radius=14, fill=ext["accent"])
    d_promo.text((54, 58), initials, fill="white")
    d_promo.text((112, 48), ext["name"][:24], fill="white")
    d_promo.text((112, 74), ext["subtitle"][:36], fill="#94a3b8")
    
    draw_badge(d_promo, 40, 120, "100% Free & Open Source", ext["accent"], "white")
    draw_badge(d_promo, 40, 160, "Zero Telemetry • No Paywalls", (40, 40, 40), "#cbd5e1")
    draw_badge(d_promo, 40, 200, "Influenzian Pro Suite", (30, 41, 59), "#38bdf8")
    promo.save(os.path.join(out_dir, "promo_small_440x280.png"))
    
    # 3. Marquee 1400x560
    marquee = Image.new('RGB', (1400, 560), ext["bg_dark"])
    d_marq = ImageDraw.Draw(marquee)
    d_marq.rounded_rectangle([40, 40, 1360, 520], radius=24, fill=ext["card_bg"], outline=ext["accent"], width=3)
    d_marq.rounded_rectangle([90, 90, 210, 210], radius=24, fill=ext["accent"])
    d_marq.text((125, 130), initials, fill="white")
    
    d_marq.text((240, 95), ext["name"], fill="white")
    d_marq.text((240, 145), ext["subtitle"], fill="#94a3b8")
    
    y_pos = 250
    for feat in ext["features"]:
        d_marq.rounded_rectangle([90, y_pos, 110, y_pos + 20], radius=4, fill=ext["accent"])
        d_marq.text((130, y_pos), feat, fill="#e2e8f0")
        y_pos += 45
        
    draw_badge(d_marq, 240, 195, "Chrome Web Store Edition", ext["accent"], "white")
    draw_badge(d_marq, 480, 195, "Manifest V3 Certified", (30, 41, 59), "#38bdf8")
    marquee.save(os.path.join(out_dir, "marquee_1400x560.png"))
    
    # 4. Screenshots (3x 1280x800)
    for i in range(1, 4):
        ss = Image.new('RGB', (1280, 800), ext["bg_dark"])
        d_ss = ImageDraw.Draw(ss)
        d_ss.rectangle([0, 0, 1280, 60], fill="#1e293b")
        d_ss.ellipse([20, 22, 36, 38], fill="#ef4444")
        d_ss.ellipse([46, 22, 62, 38], fill="#f59e0b")
        d_ss.ellipse([72, 22, 88, 38], fill="#10b981")
        d_ss.rounded_rectangle([120, 14, 1000, 46], radius=8, fill="#0f172a")
        d_ss.text((140, 22), f"https://browser.influenzian.internal/{ext['id']}/view-{i}", fill="#64748b")
        
        # Main content mock card
        d_ss.rounded_rectangle([80, 110, 1200, 720], radius=16, fill=ext["card_bg"], outline=ext["accent"], width=2)
        d_ss.text((120, 150), f"{ext['name']} — Feature Tour {i}/3", fill="white")
        d_ss.text((120, 190), ext["features"][(i-1) % len(ext["features"])], fill=ext["accent"])
        
        # Inner panel
        d_ss.rounded_rectangle([120, 250, 1160, 670], radius=12, fill="#0b0f19")
        d_ss.text((160, 290), f"Active Module: {ext['id'].upper()} ENGINE v3.0", fill="#10b981")
        d_ss.text((160, 330), "• Real-time zero-latency execution in user DOM", fill="#cbd5e1")
        d_ss.text((160, 370), "• Zero external network calls (100% offline-ready & privacy compliant)", fill="#cbd5e1")
        d_ss.text((160, 410), "• Native dark HUD seamlessly integrated into web application UI", fill="#cbd5e1")
        d_ss.text((160, 450), "• Full shortcut binding and responsive toolbar controls", fill="#cbd5e1")
        
        ss.save(os.path.join(out_dir, f"screenshot_{i}.png"))
        
    print(f"Generated complete store assets for {ext['name']} in {out_dir}")

def main():
    base_dir = "/home/shishyan/GitHub/Influenzian/Extensions/store-assets"
    os.makedirs(base_dir, exist_ok=True)
    for ext in TOP_EXTENSIONS:
        generate_assets_for_ext(ext, base_dir)

if __name__ == "__main__":
    main()

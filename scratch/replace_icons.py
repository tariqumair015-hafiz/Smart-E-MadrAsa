from PIL import Image
import os
import shutil

SOURCE = r"C:\Users\IQRA TRADERS\.gemini\antigravity-ide\brain\7b3e15ba-d50e-4561-b609-b44a3691a437\smart_madarsa_app_icon_1781981136734.png"
BASE = r"G:\My Drive\Smart E Madarsa"

targets = [
    # Play Store
    (os.path.join(BASE, "playstore_icon_512.png"), 512),
    (os.path.join(BASE, "android", "app", "ic_launcher-playstore.png"), 512),

    # mipmap icons
    (os.path.join(BASE, "android","app","src","main","res","mipmap-mdpi","ic_launcher.png"), 48),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-mdpi","ic_launcher_round.png"), 48),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-hdpi","ic_launcher.png"), 72),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-hdpi","ic_launcher_round.png"), 72),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xhdpi","ic_launcher.png"), 96),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xhdpi","ic_launcher_round.png"), 96),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxhdpi","ic_launcher.png"), 144),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxhdpi","ic_launcher_round.png"), 144),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxxhdpi","ic_launcher.png"), 192),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxxhdpi","ic_launcher_round.png"), 192),

    # Foreground icons
    (os.path.join(BASE, "android","app","src","main","res","mipmap-mdpi","ic_launcher_foreground.png"), 108),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-hdpi","ic_launcher_foreground.png"), 162),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xhdpi","ic_launcher_foreground.png"), 216),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxhdpi","ic_launcher_foreground.png"), 324),
    (os.path.join(BASE, "android","app","src","main","res","mipmap-xxxhdpi","ic_launcher_foreground.png"), 432),
    (os.path.join(BASE, "android","app","src","main","res","drawable","ic_launcher_foreground.png"), 432),

    # iOS
    (os.path.join(BASE, "ios","App","App","Assets.xcassets","AppIcon.appiconset","AppIcon-512@2x.png"), 1024),

    # Public
    (os.path.join(BASE, "public", "app_icon.png"), 512),
]

src = Image.open(SOURCE).convert("RGBA")
print(f"Source size: {src.size}")
print(f"Replacing {len(targets)} icon files...\n")

ok = 0
fail = 0
for dest, size in targets:
    try:
        img = src.resize((size, size), Image.LANCZOS)
        img.save(dest, "PNG")
        print(f"OK  {size}px  ->  {os.path.basename(dest)}")
        ok += 1
    except Exception as e:
        print(f"FAIL {dest}: {e}")
        fail += 1

print(f"\nDone! {ok} ok, {fail} failed.")

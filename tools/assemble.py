"""Build the game and copy it into desktop/game with every library local (runs offline).

Usage: python tools/assemble.py
"""
import pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
DST = ROOT / "desktop" / "game"

subprocess.run([sys.executable, str(GAME / "src" / "build.py")], check=True)
html = (GAME / "dist" / "index.html").read_text(encoding="utf-8")
replacements = [
    ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap">', ""),
    ("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js", "lib/three.min.js"),
    ("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js", "lib/GLTFLoader.js"),
    ("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js", "lib/SkeletonUtils.js"),
]
import re
html = re.sub(r"https://cdn\.jsdelivr\.net/npm/three@0\.128\.0/examples/js/(?:[a-z]+/)*([A-Za-z]+\.js)", r"lib/\1", html)
replacements = [r for r in replacements if "jsdelivr" not in r[0]]
for old, new in replacements:
    if html.count(old) != 1:
        sys.exit(f"expected exactly one occurrence of {old!r}")
    html = html.replace(old, new)
html = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1"><title>New Hire 3D</title>\n'
        "<style>html,body{margin:0;height:100%;background:#1b2433;overflow:hidden}</style></head><body>\n"
        + html + "\n</body></html>")

if DST.exists():
    shutil.rmtree(DST)
DST.mkdir(parents=True)
(DST / "index.html").write_text(html, encoding="utf-8")
for folder in ("lib", "models", "vo"):
    shutil.copytree(GAME / folder, DST / folder)
print("assembled", sum(1 for p in DST.rglob("*") if p.is_file()), "files into", DST)

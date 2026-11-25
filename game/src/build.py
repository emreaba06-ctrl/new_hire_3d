"""Assemble game/dist/index.html from the 2D game's reusable parts plus the 3D files."""
import pathlib
here = pathlib.Path(__file__).parent
src = (here.parent / "legacy" / "newhire.html").read_text(encoding="utf-8")

def between(a, b):
    i = src.index(a); j = src.index(b, i)
    return src[i:j]

css = between("<style>", "</style>")[len("<style>"):]
utils = between("const $ = (s, el = document)", "/* ---------- save ---------- */")
rules = between("/* ---------- rules ---------- */", "/* ---------- sound ---------- */")
sound = between("/* ---------- sound ---------- */", "/* ---------- avatars & icons ---------- */")
avatars = between("/* ---------- avatars & icons ---------- */", "/* ---------- run player code ---------- */")
widgets = between("/* ---------- run player code ---------- */", "/* =====================================================================\n   JOBS.")
jobs = between("const JOBS = [];", "const jobById")

def props_block():
    v1 = (here / "engine_v1.js").read_text(encoding="utf-8")
    a = v1.index("/* ---------- props ---------- */"); b = v1.index("/* ---------- people ---------- */")
    return v1[a:b].replace("new THREE.MeshBasicMaterial(", "basicMat(").replace("new THREE.MeshPhongMaterial(", "stdMat(")

head = (here / "head.html").read_text(encoding="utf-8").replace("/*__NEWHIRE_CSS__*/", css)
js = "\n".join([
    "(() => {\n\"use strict\";",
    utils, rules, sound, avatars, widgets, jobs,
    (here / "content-extra.js").read_text(encoding="utf-8"),
    (here / "content-depts.js").read_text(encoding="utf-8"),
    (here / "engine2a.js").read_text(encoding="utf-8"),
    props_block(),
    (here / "engine2b.js").read_text(encoding="utf-8").replace("function makePerson(look)", "function makePersonProc(look)").replace("function animPerson(p, mode, dt, talking)", "function animPersonProc(p, mode, dt, talking)"),
    (here / "models.js").read_text(encoding="utf-8"),
    (here / "furniture.js").read_text(encoding="utf-8"),
    (here / "audio.js").read_text(encoding="utf-8"),
    (here / "game.js").read_text(encoding="utf-8"),
    (here / "learning.js").read_text(encoding="utf-8"),
    (here / "cafe.js").read_text(encoding="utf-8"),
    (here / "extras.js").read_text(encoding="utf-8"),
    (here / "life.js").read_text(encoding="utf-8"),
    (here / "life2.js").read_text(encoding="utf-8"),
    (here / "fun.js").read_text(encoding="utf-8"),
    (here / "hustle.js").read_text(encoding="utf-8"),
    (here / "story.js").read_text(encoding="utf-8"),
    (here / "business.js").read_text(encoding="utf-8"),
    (here / "modes.js").read_text(encoding="utf-8"),
    (here / "world2.js").read_text(encoding="utf-8"),
    (here / "fixes.js").read_text(encoding="utf-8"),
    (here / "post.js").read_text(encoding="utf-8"),
    (here / "materials.js").read_text(encoding="utf-8"),
    (here / "decor.js").read_text(encoding="utf-8"),
    (here / "living.js").read_text(encoding="utf-8"),
    (here / "street.js").read_text(encoding="utf-8"),
    (here / "ui.js").read_text(encoding="utf-8"),
    (here / "style.js").read_text(encoding="utf-8"),
    (here / "play.js").read_text(encoding="utf-8"),
    (here / "play2.js").read_text(encoding="utf-8"),
    (here / "declutter.js").read_text(encoding="utf-8"),
    (here / "toon.js").read_text(encoding="utf-8"),
    (here / "online.js").read_text(encoding="utf-8"),
    "boot();\n",
    "})();",
])
out = head + "\n<script>\n" + js + "\n</script>\n"
dist = here.parent / "dist"; dist.mkdir(exist_ok=True)
(dist / "index.html").write_text(out, encoding="utf-8")
print("wrote", len(out), "bytes")

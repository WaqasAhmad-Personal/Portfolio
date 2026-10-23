"""Make the small screenshot copies used by the home-page project cards.

For every assets/projects/<slug>/<name>.webp this writes assets/projects/<slug>/card/<name>.webp,
at most 800px wide. Copies are only rebuilt when the screenshot is newer, and copies whose
screenshot was deleted are removed. Run it from the repo root after adding or changing screenshots:

    python tools/make-card-thumbs.py

Needs Pillow (pip install pillow).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'projects'
WIDTH, QUALITY = 800, 78

made = kept = removed = 0
for project in sorted(p for p in ROOT.iterdir() if p.is_dir()):
    cards = project / 'card'
    sources = {p.name: p for p in project.glob('*.webp')}
    for name, src in sources.items():
        out = cards / name
        if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
            kept += 1
            continue
        cards.mkdir(exist_ok=True)
        with Image.open(src) as im:
            if im.mode not in ('RGB', 'RGBA'):
                im = im.convert('RGBA')
            if im.width > WIDTH:
                im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
            im.save(out, 'WEBP', quality=QUALITY, method=6)
        made += 1
    if cards.exists():
        for old in cards.glob('*.webp'):
            if old.name not in sources:
                old.unlink()
                removed += 1
        if not any(cards.iterdir()):
            cards.rmdir()

print(f'card copies: {made} made, {kept} up to date, {removed} removed')

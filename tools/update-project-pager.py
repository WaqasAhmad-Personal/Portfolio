"""Write the "Previous / Next project" links at the bottom of every project page.

The order follows the project cards in index.html, wrapping around at both ends.
Run it from the repo root after adding, removing or reordering projects:

    python tools/update-project-pager.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGER = re.compile(r'<section class="project-pager">.*?</section>', re.S)

home = (ROOT / 'index.html').read_text(encoding='utf-8')
slugs = re.findall(r'<a class="project" href="projects/([^"]+)\.html"', home)

def title(slug):
    page = (ROOT / 'projects' / f'{slug}.html').read_text(encoding='utf-8')
    h1 = re.search(r'<h1>(.*?)</h1>', page, re.S).group(1)
    return html.unescape(re.sub(r'<br\s*/?>', ' ', h1)).strip()

titles = {s: title(s) for s in slugs}
for n, slug in enumerate(slugs):
    prev, nxt = slugs[n - 1], slugs[(n + 1) % len(slugs)]
    block = ('<section class="project-pager"><div class="wrap pager">'
             f'<a class="prev" href="{prev}.html"><small>← Previous project</small><strong>{html.escape(titles[prev])}</strong></a>'
             f'<a class="next" href="{nxt}.html"><small>Next project →</small><strong>{html.escape(titles[nxt])}</strong></a>'
             '</div></section>')
    path = ROOT / 'projects' / f'{slug}.html'
    page = path.read_text(encoding='utf-8')
    page = PAGER.sub(block, page) if PAGER.search(page) else page.replace('</main>', block + '</main>', 1)
    path.write_text(page, encoding='utf-8', newline='')

print(f'pager links written for {len(slugs)} project pages')

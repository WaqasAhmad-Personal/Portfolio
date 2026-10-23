# Waqas Ahmad — Senior Unity Developer Portfolio

Static portfolio site (plain HTML, CSS and JavaScript, no build step), hosted on GitHub Pages.

## Structure

```
index.html                     Home page: hero, skills, selected work, experience, about, contact
projects/<slug>.html           One page per project (22): gallery, overview, role, video, store link
assets/style.css               All styles
assets/app.js                  Albums and galleries, video cards, motion effects, page transitions
assets/projects/<slug>/*.webp  Project screenshots (full size, used on the project pages)
assets/projects/<slug>/card/   Small copies (800px wide) used by the home-page cards
tools/make-card-thumbs.py      Rebuilds those small copies
tools/update-project-pager.py  Rewrites the Previous / Next project links on every project page
assets/images/<slug>.svg       Cover shown until the screenshots load
assets/og/<slug>.jpg           1200×630 link-preview images (og:image / twitter:image)
assets/Waqas_Ahmad_Resume.pdf  Downloadable CV
```

## Adding or changing screenshots

1. Put the images in `assets/projects/<slug>/` as WebP (about 1600px wide, under ~500 KB each).
2. List them in the `data-images` attribute of the project's card in `index.html` **and** of the gallery in `projects/<slug>.html`, in display order, with the SVG cover last. Always list the full-size file; the cards pick up the small copy themselves.
3. Rebuild the card copies (needs Python with Pillow: `pip install pillow`):

   ```bash
   python tools/make-card-thumbs.py
   ```

   It only rebuilds copies whose screenshot changed, and deletes copies of screenshots you removed. If you skip this step the card still works, it just loads the full-size image.

Only images that actually load are shown, so a missing file never shows as a broken image, but keep the lists in sync with the folder.

The home page loads lazily: each card fetches its first screenshot as it scrolls into view, and the rest only when the visitor uses the arrows (or hovers over the card).

## Adding, removing or reordering projects

The category tabs above the cards are built automatically from each card's category label (the `<small>` text), so a new category gets its own tab with no extra work.

The Previous / Next links at the bottom of each project page follow the order of the cards in `index.html`. After changing that order, or adding or removing a project page, run:

```bash
python tools/update-project-pager.py
```

## Running locally

Open the site through a local server rather than straight from disk, so YouTube embeds and page transitions behave as they do online:

```bash
python -m http.server 8765
```

Then visit http://localhost:8765.

## Deploying

GitHub Pages serves the site from the `main` branch. Merge your changes into `main` and push.

# Waqas Ahmad — Senior Unity Developer Portfolio

Static portfolio site (plain HTML, CSS and JavaScript, no build step), hosted on GitHub Pages.

## Structure

```
index.html                     Home page: hero, skills, selected work, experience, about, contact
projects/<slug>.html           One page per project (22): gallery, overview, role, video, store link
assets/style.css               All styles
assets/app.js                  Albums and galleries, video cards, motion effects, page transitions
assets/projects/<slug>/*.webp  Project screenshots
assets/images/<slug>.svg       Cover shown until the screenshots load
assets/og/<slug>.jpg           1200×630 link-preview images (og:image / twitter:image)
assets/Waqas_Ahmad_Resume.pdf  Downloadable CV
```

## Adding or changing screenshots

1. Put the images in `assets/projects/<slug>/` as WebP (about 1600px wide, under ~500 KB each).
2. List them in the `data-images` attribute of the project's card in `index.html` **and** of the gallery in `projects/<slug>.html`, in display order, with the SVG cover last.

Only images that actually load are shown, so a missing file never shows as a broken image, but keep the lists in sync with the folder.

## Running locally

Open the site through a local server rather than straight from disk, so YouTube embeds and page transitions behave as they do online:

```bash
python -m http.server 8765
```

Then visit http://localhost:8765.

## Deploying

GitHub Pages serves the site from the `main` branch. Merge your changes into `main` and push.

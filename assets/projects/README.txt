PROJECT SCREENSHOT ALBUMS

Each project has a folder: assets/projects/<project-slug>/ with numbered screenshots (1.webp, 2.webp, ...).

To add or change screenshots, list the file paths in the data-images attribute of that project's card in index.html and of its page in projects/<project-slug>.html.
Both the home-page cards and the project pages (assets/app.js) only show images that actually load, in the listed order. The SVG in assets/images is used as the cover until photos load.

Tip: keep screenshots under ~500 KB each (resize to ~1600px wide, save as JPG/WebP).

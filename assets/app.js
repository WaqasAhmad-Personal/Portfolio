// Shared album/gallery logic for the home page and all project pages.
// Crossfade between images (instant when the visitor prefers reduced motion).
const MOTION_OK = !matchMedia('(prefers-reduced-motion: reduce)').matches;
function swapSrc(el, src) {
  if (!MOTION_OK || !el.getAttribute('src') || el.getAttribute('src') === src) { el.src = src; return; }
  const token = el._swap = (el._swap || 0) + 1;
  const pre = new Image();
  const apply = () => {
    if (token !== el._swap) return;
    el.classList.add('swapping');
    setTimeout(() => {
      if (token !== el._swap) return;
      el.src = src;
      requestAnimationFrame(() => el.classList.remove('swapping'));
    }, 200);
  };
  pre.onload = pre.onerror = apply;
  pre.src = src;
}

// Only images that actually load are shown; the SVG cover is the fallback.
function loadValid(srcs, done) {
  const photos = [...new Set(srcs.filter(s => !/\.svg$/i.test(s)))];
  const results = new Array(photos.length);
  let pending = photos.length;
  if (!pending) { done([]); return; }
  photos.forEach((src, n) => {
    const im = new Image();
    im.onload = () => { results[n] = src; if (!--pending) done(results.filter(Boolean)); };
    im.onerror = () => { if (!--pending) done(results.filter(Boolean)); };
    im.src = src;
  });
}

function parseImages(root) {
  try { return JSON.parse(root.dataset.images || '[]'); } catch (e) { return []; }
}

// Tall (phone-shaped) screenshots sit on a blurred copy of themselves instead of empty bars.
function fitTall(img) {
  const box = img.parentElement;
  const back = document.createElement('div');
  back.className = 'img-backdrop';
  back.setAttribute('aria-hidden', 'true');
  back.appendChild(document.createElement('span'));
  box.insertBefore(back, img);
  const update = () => {
    const tall = img.naturalWidth > 0 && img.naturalWidth / img.naturalHeight < 1.2;
    box.classList.toggle('tall', tall);
    if (tall) back.firstChild.style.backgroundImage = 'url("' + img.currentSrc + '")';
  };
  img.addEventListener('load', update);
  if (img.complete) update();
}

// Home-page cards show the small copies in <slug>/card/ (made by tools/make-card-thumbs.py),
// falling back to the full screenshot if a copy is missing.
const cardSrc = src => src.replace(/\/([^/]+\.webp)$/i, '/card/$1');

// Calls done with the first source that loads, or null when none do.
function firstLoadable(srcs, done) {
  if (!srcs.length) { done(null); return; }
  const im = new Image();
  im.onload = () => done(srcs[0]);
  im.onerror = () => firstLoadable(srcs.slice(1), done);
  im.src = srcs[0];
}

// Albums load lazily: the first image when the card nears the screen, the others only when
// the visitor heads for them. An image that fails to load is dropped from the album.
function setupAlbum(root) {
  const img = root.querySelector('[data-main]');
  const count = root.querySelector('[data-count]');
  const dots = root.querySelector('[data-dots]');
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  const nav = root.querySelector('.album-nav');
  const list = [...new Set(parseImages(root).filter(s => !/\.svg$/i.test(s)))];
  const urls = new Map();
  let i = 0, started = false, engaged = false;
  fitTall(img);

  function resolve(src, done) {
    if (urls.has(src)) { done(urls.get(src)); return; }
    firstLoadable([cardSrc(src), src], url => { urls.set(src, url); done(url); });
  }
  function show(n, d) {
    if (nav) nav.hidden = list.length < 2;
    if (!list.length) return;
    i = (n + list.length) % list.length;
    const src = list[i];
    resolve(src, url => {
      if (list[i] !== src) return; // the visitor has already moved on
      if (!url) { list.splice(i, 1); show(d < 0 ? i - 1 : i, d); return; }
      swapSrc(img, url);
      count.textContent = (i + 1) + ' / ' + list.length;
      dots.innerHTML = list.map((_, k) => '<span class="album-dot ' + (k === i ? 'active' : '') + '" aria-hidden="true"></span>').join('');
      warmNext(d);
    });
  }
  // Once the visitor shows interest in a card, preload the image the arrows lead to next.
  function warmNext(d) {
    if (engaged && list.length > 1) resolve(list[(i + d + list.length) % list.length], () => {});
  }
  function start() { if (!started) { started = true; show(0, 1); } }
  function step(d, e) {
    e.preventDefault(); e.stopPropagation();
    engaged = true;
    start();
    if (list.length) show(i + d, d);
  }
  prev.onclick = e => step(-1, e);
  next.onclick = e => step(1, e);
  root.addEventListener('pointerenter', () => { if (!engaged) { engaged = true; start(); warmNext(1); } });
  if (nav) nav.hidden = true;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      if (entries.some(en => en.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '300px 0px' });
    io.observe(root);
  } else start();
}

function setupGallery(root) {
  const main = root.querySelector('[data-gallery-main]');
  const thumbs = root.querySelector('[data-thumbs]');
  const count = root.querySelector('[data-gallery-count]');
  const controls = root.querySelector('.gallery-controls');
  const title = main.alt || 'Project';
  let valid = [], i = 0;
  fitTall(main);

  function render() {
    if (!valid.length) return;
    swapSrc(main, valid[i]);
    count.textContent = (i + 1) + ' / ' + valid.length;
    thumbs.innerHTML = valid.map((src, n) =>
      '<img class="gallery-thumb ' + (n === i ? 'active' : '') + '" src="' + src + '" data-n="' + n +
      '" alt="' + title + ' screenshot ' + (n + 1) + '" tabindex="0" role="button" loading="lazy">').join('');
    thumbs.querySelectorAll('img').forEach(t => {
      const go = () => { i = +t.dataset.n; render(); };
      t.onclick = go;
      t.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
  }
  root.querySelector('[data-gallery-prev]').onclick = () => { if (valid.length) { i = (i - 1 + valid.length) % valid.length; render(); } };
  root.querySelector('[data-gallery-next]').onclick = () => { if (valid.length) { i = (i + 1) % valid.length; render(); } };
  loadValid(parseImages(root), list => {
    valid = list;
    if (controls) controls.hidden = valid.length < 2;
    render();
  });
}

document.querySelectorAll('.project-album').forEach(setupAlbum);
document.querySelectorAll('.project-gallery').forEach(setupGallery);

// Category tabs above the project cards, built from each card's category label.
// The chosen tab is remembered for the visit, so coming back from a project page keeps it.
// Only the first few cards of a tab show until the visitor asks for the rest (also remembered).
const filterBar = document.querySelector('[data-filters]');
if (filterBar) {
  const SHOWN = 6; // two full rows at 3, 2 or 1 columns
  const grid = document.querySelector('.projects');
  const cards = [...grid.querySelectorAll('.project')];
  const moreBtn = document.createElement('button');
  moreBtn.type = 'button';
  moreBtn.className = 'btn show-more';
  const moreWrap = document.createElement('div');
  moreWrap.className = 'show-more-wrap';
  moreWrap.appendChild(moreBtn);
  grid.after(moreWrap);
  let current = 'all', expanded = false;
  try { expanded = sessionStorage.getItem('projectsExpanded') === '1'; } catch (e) {}
  const catOf = card => card.querySelector('.project-body small').textContent.trim().toLowerCase();
  const label = cat => cat.replace(/(^|[\s-])\w/g, ch => ch.toUpperCase());
  const counts = new Map();
  cards.forEach(card => counts.set(catOf(card), (counts.get(catOf(card)) || 0) + 1));
  const tabs = [['all', 'All', cards.length], ...[...counts].map(([cat, n]) => [cat, label(cat), n])];
  filterBar.innerHTML = tabs.map(([cat, name, n]) =>
    '<button type="button" data-cat="' + cat + '" aria-pressed="false">' + name + '<span>' + n + '</span></button>').join('');

  const choose = (cat, clicked) => {
    if (!tabs.some(t => t[0] === cat)) cat = 'all';
    current = cat;
    filterBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === cat));
    const matching = cards.filter(card => cat === 'all' || catOf(card) === cat);
    cards.forEach(card => {
      card.hidden = !matching.includes(card) || (!expanded && matching.indexOf(card) >= SHOWN);
      if (clicked && !card.hidden) card.classList.add('in'); // cards shown by a tab or button skip the scroll-in animation
    });
    moreWrap.hidden = matching.length <= SHOWN;
    moreBtn.textContent = expanded ? 'Show less' : 'Show more (' + (matching.length - SHOWN) + ')';
    moreBtn.setAttribute('aria-expanded', expanded);
    try { sessionStorage.setItem('projectFilter', cat); } catch (e) {}
  };
  filterBar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(b.dataset.cat, true); });
  moreBtn.addEventListener('click', () => {
    expanded = !expanded;
    try { sessionStorage.setItem('projectsExpanded', expanded ? '1' : '0'); } catch (e) {}
    choose(current, true);
    // After collapsing, bring the visitor back to the cards instead of leaving them far below
    if (!expanded) grid.closest('section').scrollIntoView({ behavior: MOTION_OK ? 'smooth' : 'auto' });
  });
  let saved = 'all';
  try { saved = sessionStorage.getItem('projectFilter') || 'all'; } catch (e) {}
  choose(saved);
}

document.querySelectorAll('.video-card[data-yt]').forEach(card => {
  const url = 'https://www.youtube.com/watch?v=' + card.dataset.yt + '&t=' + (card.dataset.start || 0) + 's';
  const play = () => {
    // YouTube refuses to embed pages opened from disk (Error 153); open it on YouTube instead.
    if (location.protocol === 'file:') { window.open(url, '_blank', 'noopener'); return; }
    card.innerHTML = '<iframe src="https://www.youtube.com/embed/' + card.dataset.yt + '?autoplay=1&start=' + (card.dataset.start || 0) +
      '" title="Gameplay video" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  };
  card.addEventListener('click', play);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
});

// mailto: does nothing on computers without a desktop mail app, so open Gmail compose instead.
document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const to = a.getAttribute('href').slice(7);
    window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(to), '_blank', 'noopener');
  });
});

// Mobile menu: on narrow screens the section links open from the toggle button.
const navBar = document.querySelector('.nav'), menuBtn = document.querySelector('.menu-toggle');
if (navBar && menuBtn) {
  const setMenu = open => {
    navBar.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!navBar.classList.contains('menu-open')));
  navBar.querySelectorAll('.navlinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => { if (!navBar.contains(e.target)) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
}

// ---- Motion effects (skipped entirely when the visitor prefers reduced motion) ----
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');

  const targets = document.querySelectorAll('.project, .job, .skill-group, .stat, #work .section-head, #experience .section-head');
  const stagger = new Map();
  targets.forEach(el => {
    const group = el.parentElement;
    const n = stagger.get(group) || 0;
    stagger.set(group, n + 1);
    el.style.setProperty('--d', Math.min(n % 6, 5) * 0.07 + 's');
    el.classList.add('reveal');
  });

  function countUp(el) {
    const m = /^(\d+)(\+?)$/.exec(el.textContent.trim());
    if (!m) return;
    const end = +m[1], t0 = performance.now(), dur = 1100;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + m[2];
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function show(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    const num = el.querySelector('.num');
    if (num) countUp(num);
    io.unobserve(el);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) show(e.target); });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(el => io.observe(el));

  // Fast scrolls and #anchor jumps can skip elements without an intersection event: reveal anything already passed.
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      targets.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) show(el); });
    });
  }, { passive: true });

  // 3D tilt + glare on project cards: mouse devices only, never on touch screens
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.project').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6) + 'deg) rotateY(' + ((x - 0.5) * 8) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });
  }
})();

// ---- More motion: typewriter, hero particles, cursor glow, nav, page transitions ----
(function () {
  if (!MOTION_OK) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Nav shrinks once the page is scrolled
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Typewriter role line
  const type = document.querySelector('.type[data-roles]');
  if (type) {
    let roles = [];
    try { roles = JSON.parse(type.dataset.roles); } catch (e) {}
    if (roles.length > 1) {
      let r = 0, n = roles[0].length, del = true;
      const step = () => {
        if (del) {
          n--; type.textContent = roles[r].slice(0, n);
          if (n === 0) { del = false; r = (r + 1) % roles.length; return setTimeout(step, 350); }
          return setTimeout(step, 35);
        }
        n++; type.textContent = roles[r].slice(0, n);
        if (n === roles[r].length) { del = true; return setTimeout(step, 1800); }
        setTimeout(step, 75);
      };
      setTimeout(step, 2200);
    }
  }

  // Cursor glow (mouse devices only)
  if (fine) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    addEventListener('pointermove', e => {
      glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      glow.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
  }

  // Floating particles behind the whole page (fixed to the viewport; few on phones, paused when the tab is hidden)
  if (document.querySelector('.hero')) {
    const cv = document.createElement('canvas');
    cv.className = 'page-canvas';
    cv.setAttribute('aria-hidden', 'true');
    document.body.prepend(cv);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, parts = [], raf = 0;
    const count = () => (innerWidth < 700 ? 18 : 45);
    function make() {
      return { x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .6,
               vy: -(Math.random() * .22 + .06), vx: (Math.random() - .5) * .12, a: Math.random() * .35 + .12 };
    }
    function resize() {
      // Phones fire resize when the address bar hides on scroll: only re-seed when the width changes.
      const reseed = innerWidth !== w;
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reseed) parts = Array.from({ length: count() }, make);
    }
    function frame() {
      raf = 0;
      if (document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
        if (p.x < -4) p.x = w + 4; else if (p.x > w + 4) p.x = -4;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(242,183,5,' + p.a + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    resize();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); kick(); }, 150); });
    document.addEventListener('visibilitychange', kick);
    kick();
  }

  // Page transitions: fade out on internal links (the next page fades in via CSS)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return; // same-page / #anchor
    if (!/\.html?$|\/$/.test(u.pathname)) return;
    e.preventDefault();
    document.documentElement.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 220);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.documentElement.classList.remove('leaving'); });
})();

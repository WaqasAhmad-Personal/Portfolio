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

function setupAlbum(root) {
  const img = root.querySelector('[data-main]');
  const count = root.querySelector('[data-count]');
  const dots = root.querySelector('[data-dots]');
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  const nav = root.querySelector('.album-nav');
  let valid = [], i = 0;

  function render() {
    if (!valid.length) return;
    swapSrc(img, valid[i]);
    count.textContent = (i + 1) + ' / ' + valid.length;
    dots.innerHTML = valid.map((_, n) => '<span class="album-dot ' + (n === i ? 'active' : '') + '" aria-hidden="true"></span>').join('');
  }
  function step(d, e) {
    e.preventDefault(); e.stopPropagation();
    if (valid.length) { i = (i + d + valid.length) % valid.length; render(); }
  }
  prev.onclick = e => step(-1, e);
  next.onclick = e => step(1, e);
  if (nav) nav.hidden = true;
  loadValid(parseImages(root), list => {
    valid = list;
    if (nav) nav.hidden = valid.length < 2;
    render();
  });
}

function setupGallery(root) {
  const main = root.querySelector('[data-gallery-main]');
  const thumbs = root.querySelector('[data-thumbs]');
  const count = root.querySelector('[data-gallery-count]');
  const controls = root.querySelector('.gallery-controls');
  const title = main.alt || 'Project';
  let valid = [], i = 0;

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

  const targets = document.querySelectorAll('.project, .job, .skill-bar, .stat, #work .section-head, #experience .section-head');
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

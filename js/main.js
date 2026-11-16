/* ==========================================================================
   Villa Serena: site behaviour
   ========================================================================== */

/**
 * BOOKING LINK (placeholder)
 * Paste the owner's existing direct-booking URL here, e.g.
 *   const BOOKING_URL = "https://example-booking-site.com/villa";
 * While empty, booking buttons scroll to the booking section and show a
 * clearly marked "demo placeholder" message instead of a fake booking flow.
 */
const BOOKING_URL = "";

/* --------------------------------------------------------------------------
   Photo library. Order and tile sizes are curated for the 4-column layout.
   size: "big" (2x2), "wide" (2x1), or "" (1x1)
   -------------------------------------------------------------------------- */
const PHOTOS = [
  { slug: "pool-lanai",            cat: "outdoor",   caption: "Private pool, spa & covered lanai",  w: 1206, size: "big" },
  { slug: "exterior-front",        cat: "outdoor",   caption: "Welcome to the villa",               w: 1206, size: "wide" },
  { slug: "kitchen",               cat: "living",    caption: "Fully equipped kitchen",             w: 1206 },
  { slug: "home-theater",          cat: "fun",       caption: "Home theater",                       w: 1206 },
  { slug: "living-room",           cat: "living",    caption: "Living room",                        w: 2560, size: "wide" },
  { slug: "dining-room",           cat: "living",    caption: "Dining room",                        w: 2560 },
  { slug: "game-room",             cat: "fun",       caption: "Game room",                          w: 2560 },
  { slug: "bedroom-patio",         cat: "bedrooms",  caption: "Bedroom with patio access",          w: 2560 },
  { slug: "bunk-room",             cat: "bedrooms",  caption: "Kids' bunk room",                    w: 2560 },
  { slug: "bedroom-teal",          cat: "bedrooms",  caption: "Bedroom",                            w: 2560, size: "wide" },
  { slug: "pool-deck",             cat: "outdoor",   caption: "Pool deck & sun loungers",           w: 1206, size: "wide" },
  { slug: "bathroom-double-vanity",cat: "bathrooms", caption: "Bathroom with double vanity & tub",  w: 1206, size: "wide" },
  // ---- shown after "View all photos" ----
  { slug: "dining-living",         cat: "living",    caption: "Open-plan dining & living",          w: 2560, size: "wide" },
  { slug: "bedroom-twin-beds",     cat: "bedrooms",  caption: "Bedroom",                            w: 2560, size: "wide" },
  { slug: "kids-bedroom",          cat: "bedrooms",  caption: "Themed kids' bedroom",               w: 2560 },
  { slug: "bedroom-navy",          cat: "bedrooms",  caption: "Bedroom",                            w: 2560 },
  { slug: "bedroom-white",         cat: "bedrooms",  caption: "Bedroom",                            w: 2560 },
  { slug: "bedroom-two-beds",      cat: "bedrooms",  caption: "Bedroom",                            w: 2560 },
  { slug: "sitting-area",          cat: "living",    caption: "Sitting area",                       w: 2560 },
  { slug: "workspace",             cat: "living",    caption: "Workspace",                          w: 2560 },
  { slug: "laundry-room",          cat: "living",    caption: "Laundry room",                       w: 2560 },
  { slug: "bathroom-walk-in-shower",cat: "bathrooms",caption: "Bathroom",                           w: 2560 },
  { slug: "bathroom-glass-shower", cat: "bathrooms", caption: "Bathroom",                           w: 2560 },
  { slug: "bathroom-shower",       cat: "bathrooms", caption: "Bathroom",                           w: 2560 },
  { slug: "bathroom-kids",         cat: "bathrooms", caption: "Bathroom",                           w: 2560 },
  { slug: "bathroom-vanity",       cat: "bathrooms", caption: "Bathroom",                           w: 2560 },
];
const INITIAL_COUNT = 4;
const IMG = "assets/img/";

const widthsFor = (w) => (w > 1206 ? [640, 1024, 1600, 2200] : [640, 1024, 1206]);
const srcset = (p, max = Infinity) =>
  widthsFor(p.w).filter((x) => x <= max).map((x) => `${IMG}${p.slug}-${x}.webp ${x}w`).join(", ");

document.documentElement.classList.add("js");

/* --------------------------------------------------------------------------
   Header: scrolled state, mobile menu, active link
   -------------------------------------------------------------------------- */
const header = document.querySelector(".site-header");
const mobileBar = document.querySelector(".mobile-bar");
const hero = document.querySelector(".hero");

let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 40);
  // hide the menu bar while scrolling down, bring it back on any scroll up
  const delta = y - lastY;
  if (Math.abs(delta) > 6) {
    const menuOpen = document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", delta > 0 && y > 320 && !menuOpen);
    lastY = y;
  }
  const pastHero = y > (hero ? hero.offsetHeight * 0.75 : 600);
  const nearEnd = window.innerHeight + y > document.body.scrollHeight - 40;
  mobileBar.classList.toggle("is-visible", pastHero && !nearEnd);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const menuBtn = document.querySelector(".menu-toggle");
const menu = document.getElementById("mobile-menu");

function setMenu(open) {
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  document.body.classList.toggle("menu-open", open);
  document.body.classList.toggle("no-scroll", open);
  if (open) {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add("is-open"));
  } else {
    menu.classList.remove("is-open");
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 400);
  }
}
menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

// highlight the nav link for the section in view
const navLinks = [...document.querySelectorAll(".primary-nav a")];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => navObserver.observe(s));

/* --------------------------------------------------------------------------
   Reveal on scroll
   -------------------------------------------------------------------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-in");
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

function observeReveals(root = document) {
  // stagger siblings in grids/lists
  root.querySelectorAll(".reveal:not(.is-in)").forEach((el) => {
    const group = el.parentElement;
    const siblings = [...group.children].filter((c) => c.classList.contains("reveal"));
    if (siblings.length > 2) el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 8) * 70}ms`;
    revealObserver.observe(el);
  });
}
observeReveals();

/* --------------------------------------------------------------------------
   Gallery
   -------------------------------------------------------------------------- */
const grid = document.getElementById("gallery-grid");
const moreBtn = document.getElementById("gallery-more");
const chips = [...document.querySelectorAll(".gallery-filters .chip")];
let currentFilter = "all";
let expanded = false;
let visible = []; // photos currently listed (lightbox order)

const zoomIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

function gridColumns() {
  return getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 4;
}

function renderGallery() {
  const all = currentFilter === "all";
  const list = all ? PHOTOS : PHOTOS.filter((p) => p.cat === currentFilter);
  const shown = all && !expanded ? list.slice(0, INITIAL_COUNT) : list;
  visible = list;

  const cols = gridColumns();
  const curated = all && cols === 4;
  // in other layouts, widen the first few tiles so the last row is always full
  const extra = curated ? 0 : (cols - (shown.length % cols)) % cols;

  grid.innerHTML = "";
  shown.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const size = curated ? p.size || "" : i < extra ? "wide" : "";
    btn.className = `g-item ${size}`.trim();
    btn.style.animationDelay = `${Math.min(i, 12) * 45}ms`;
    btn.setAttribute("aria-label", `Open photo: ${p.caption}`);
    const sizes = size === "big" || size === "wide" ? "(min-width: 960px) 50vw, 100vw" : "(min-width: 960px) 25vw, 50vw";
    btn.innerHTML = `
      <picture>
        <source type="image/webp" srcset="${srcset(p, 1600)}" sizes="${sizes}">
        <img src="${IMG}${p.slug}.jpg" alt="${p.caption}" loading="lazy" decoding="async">
      </picture>
      <span class="g-cap">${p.caption}${zoomIcon}</span>`;
    btn.addEventListener("click", () => openLightbox(list.indexOf(p)));
    grid.appendChild(btn);
  });

  const hidden = list.length - shown.length;
  moreBtn.parentElement.hidden = hidden <= 0 && !(all && expanded);
  moreBtn.textContent = all && expanded ? "Show fewer photos" : "Show all photos";
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-selected", String(c === chip)); });
    currentFilter = chip.dataset.filter;
    renderGallery();
  });
});

moreBtn.addEventListener("click", () => {
  const collapsing = expanded;
  expanded = !expanded;
  renderGallery();
  if (collapsing) document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
});

let lastCols = 0;
window.addEventListener("resize", () => {
  const c = gridColumns();
  if (c !== lastCols) { lastCols = c; renderGallery(); }
});
renderGallery();
lastCols = gridColumns();

/* --------------------------------------------------------------------------
   Lightbox
   -------------------------------------------------------------------------- */
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-caption");
const lbCount = document.getElementById("lb-count");
const lbThumbs = document.getElementById("lb-thumbs");
let lbIndex = 0;
let lastFocus = null;

function showSlide(i) {
  lbIndex = (i + visible.length) % visible.length;
  const p = visible[lbIndex];
  lbImg.classList.add("is-loading");
  const img = new Image();
  img.sizes = "100vw";
  img.srcset = srcset(p);
  img.src = `${IMG}${p.slug}.jpg`;
  const swap = () => {
    lbImg.srcset = img.srcset;
    lbImg.sizes = "100vw";
    lbImg.src = img.src;
    lbImg.alt = p.caption;
    requestAnimationFrame(() => lbImg.classList.remove("is-loading"));
  };
  img.decode ? img.decode().then(swap, swap) : (img.onload = swap);
  lbCap.textContent = p.caption;
  lbCount.textContent = `${lbIndex + 1} / ${visible.length}`;
  [...lbThumbs.children].forEach((t, n) => t.classList.toggle("is-active", n === lbIndex));
  const active = lbThumbs.children[lbIndex];
  if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  // warm the neighbours
  [1, -1].forEach((d) => {
    const n = visible[(lbIndex + d + visible.length) % visible.length];
    const pre = new Image(); pre.sizes = "100vw"; pre.srcset = srcset(n);
  });
}

function openLightbox(i) {
  lastFocus = document.activeElement;
  lbThumbs.innerHTML = "";
  visible.forEach((p, n) => {
    const t = document.createElement("button");
    t.type = "button";
    t.setAttribute("aria-label", `Show photo ${n + 1}: ${p.caption}`);
    t.innerHTML = `<img src="${IMG}${p.slug}-640.webp" alt="" loading="lazy">`;
    t.addEventListener("click", () => showSlide(n));
    lbThumbs.appendChild(t);
  });
  lb.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => lb.classList.add("is-open"));
  showSlide(i);
  document.getElementById("lb-close").focus();
}

function closeLightbox() {
  lb.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { lb.hidden = true; }, 350);
  if (lastFocus) lastFocus.focus();
}

document.getElementById("lb-close").addEventListener("click", closeLightbox);
document.getElementById("lb-prev").addEventListener("click", () => showSlide(lbIndex - 1));
document.getElementById("lb-next").addEventListener("click", () => showSlide(lbIndex + 1));
lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "lb-stage") closeLightbox(); });

// swipe
let touchX = null, touchY = null;
const stage = document.getElementById("lb-stage");
stage.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
stage.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) showSlide(lbIndex + (dx < 0 ? 1 : -1));
  touchX = touchY = null;
});

/* --------------------------------------------------------------------------
   Booking buttons
   -------------------------------------------------------------------------- */
const modal = document.getElementById("book-modal");
const placeholder = document.getElementById("booking-placeholder");
const bookSection = document.getElementById("book");

function openModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  document.body.classList.add("no-scroll");
  requestAnimationFrame(() => modal.classList.add("is-open"));
  modal.querySelector(".modal-close").focus();
}
function closeModal() {
  modal.classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { modal.hidden = true; }, 350);
  if (lastFocus) lastFocus.focus();
}
modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest("[data-close]")) closeModal(); });

if (BOOKING_URL) {
  document.querySelectorAll("[data-book]").forEach((a) => {
    a.href = BOOKING_URL;
    a.target = "_blank";
    a.rel = "noopener";
  });
  if (placeholder) placeholder.hidden = true;
} else {
  document.querySelectorAll("[data-book]").forEach((a) => {
    a.addEventListener("click", (e) => {
      // inside the booking section: explain the placeholder.
      // elsewhere: let the link scroll to the booking section.
      if (a.closest("#book")) {
        e.preventDefault();
        openModal();
      } else {
        placeholder.classList.remove("pulse");
        setTimeout(() => placeholder.classList.add("pulse"), 700);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Keyboard
   -------------------------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if (!lb.hidden) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showSlide(lbIndex + 1);
    if (e.key === "ArrowLeft") showSlide(lbIndex - 1);
    if (e.key === "Tab") trapFocus(e, lb);
  } else if (!modal.hidden) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") trapFocus(e, modal);
  } else if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
    setMenu(false);
    menuBtn.focus();
  }
});

function trapFocus(e, container) {
  const f = [...container.querySelectorAll("button, a[href]")].filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

document.getElementById("year").textContent = new Date().getFullYear();

/* --------------------------------------------------------------------------
   Gold buttons catch the light once as they scroll into view
   -------------------------------------------------------------------------- */
if ("IntersectionObserver" in window) {
  const shineObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("shine"); shineObs.unobserve(e.target); }
    });
  }, { threshold: 0.9 });
  document.querySelectorAll("main .btn-gold, .section .btn-gold").forEach((b) => shineObs.observe(b));
}

/* --------------------------------------------------------------------------
   Headings write themselves in, lists arrive item by item, numbers count up.
   Only text moves; photos stay still.
   -------------------------------------------------------------------------- */
(() => {
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });

  // headings: split plain-text headings into words
  document.querySelectorAll("main h2.display, main h3.subhead").forEach((h) => {
    if (h.children.length) return;
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${w}</span>`).join(" ");
    h.classList.add("split");
    io.observe(h);
  });

  // lists of text
  document.querySelectorAll(".kc-list, .pc-list, .amen-list, .rooms").forEach((list) => {
    [...list.children].forEach((li, i) => li.style.setProperty("--i", Math.min(i, 9)));
    list.classList.add("stagger");
    io.observe(list);
  });

  // numbers
  const fmt = (n) => n.toLocaleString("en-US");
  function countUp(el) {
    const target = Number(el.dataset.count);
    const dur = target > 100 ? 1600 : 1100;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.querySelectorAll(".vstat-num, .bed-mix b, .pc-amount").forEach((el) => {
    const n = Number(el.textContent.replace(/[^0-9]/g, ""));
    if (!n) return;
    el.dataset.count = n;
    el.style.minWidth = el.offsetWidth + "px"; // keep the width steady while counting
    el.style.display = el.style.display || "inline-block";
    el.textContent = "0";
    io.observe(el);
  });
})();

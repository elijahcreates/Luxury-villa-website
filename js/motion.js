/* ==========================================================================
   Villa Serena: scroll motion
   Smooth scrolling, a hero that settles into a framed photo, photos that
   open like a curtain as you scroll, a sideways photo strip, a moving
   amenities ribbon, words that light up, a custom cursor and magnetic
   buttons. Everything is tied to the scroll position, so nothing pops in.
   Turned off entirely for visitors who prefer reduced motion.
   ========================================================================== */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(min-width: 900px) and (pointer: fine)").matches;
  if (reduce) return;

  document.documentElement.classList.add("motion");

  /* ---------- smooth scrolling (desktop mouse / trackpad) ---------- */
  let lenis = null;
  if (desktop && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // pause while the menu, lightbox or booking dialog is open
    new MutationObserver(() => {
      document.body.classList.contains("no-scroll") ? lenis.stop() : lenis.start();
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // in-page links glide instead of jumping
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#top" ? 0 : -72, duration: 1.4 });
    });
  }

  /* ---------- hero: the photo settles into a framed card as you scroll ---------- */
  const heroMedia = document.querySelector(".hero-media");
  if (desktop && heroMedia) {
    const heroTl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    heroTl
      .fromTo(heroMedia,
        { clipPath: "inset(0% 0% 0% 0% round 0px)" },
        { clipPath: "inset(6% 4% 0% 4% round 28px)", ease: "none" }, 0)
      .to(heroMedia, { yPercent: 14, ease: "none" }, 0)
      .to(".hero-shade", { opacity: 0.6, ease: "none" }, 0)
      .to(".hero-content", { yPercent: -35, opacity: 0, ease: "none" }, 0)
      .to(".scroll-cue", { opacity: 0, ease: "none", duration: 0.2 }, 0);
  }

  /* ---------- photos open like a curtain, tied to the scroll ---------- */
  const curtains = document.querySelectorAll(
    ".wm-main, .wm-accent, .photo-band figure, .amen-photo, .villa-band figure"
  );
  curtains.forEach((fig) => {
    const radius = getComputedStyle(fig).borderTopLeftRadius || "0px";
    const pic = fig.querySelector("picture");
    const st = { trigger: fig, start: "top 95%", end: "top 40%", scrub: 0.6 };
    gsap.fromTo(fig,
      { clipPath: `inset(100% 0% 0% 0% round ${radius})` },
      { clipPath: `inset(0% 0% 0% 0% round ${radius})`, ease: "none", scrollTrigger: st });
    if (pic) gsap.fromTo(pic, { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { ...st, end: "bottom 30%" } });
  });

  /* ---------- amenities ribbon: moves on its own, speeds up with your scroll ---------- */
  const track = document.querySelector(".ribbon-track");
  if (track) {
    track.innerHTML += track.innerHTML; // second copy for a seamless loop
    const loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
    let dir = 1;
    ScrollTrigger.create({
      onUpdate(self) {
        dir = self.direction;
        const boost = Math.min(Math.abs(self.getVelocity()) / 250, 5);
        gsap.to(loop, {
          timeScale: dir * (1 + boost), duration: 0.2, overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, overwrite: true }),
        });
      },
    });
  }

  /* ---------- words light up as you read ---------- */
  document.querySelectorAll("[data-lightup]").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.setAttribute("aria-label", p.textContent.trim());
    p.innerHTML = words.map((w) => `<span class="lw" aria-hidden="true">${w}</span>`).join(" ");
    gsap.fromTo(p.querySelectorAll(".lw"),
      { opacity: 0.16 },
      { opacity: 1, stagger: 0.08, ease: "none",
        scrollTrigger: { trigger: p, start: "top 85%", end: "bottom 50%", scrub: true } });
  });

  /* ---------- sideways photo strip (desktop) ---------- */
  const strip = document.querySelector(".amen-strip");
  if (desktop && strip) {
    const wrap = document.createElement("div");
    wrap.className = "hs-wrap";
    strip.parentNode.insertBefore(wrap, strip);
    wrap.appendChild(strip);
    strip.classList.add("is-hscroll");
    const intro = document.createElement("div");
    intro.className = "hs-intro";
    intro.innerHTML = '<h3>More of the villa</h3><p>Scroll to look around.</p>';
    strip.prepend(intro);

    const distance = () => Math.max(0, strip.scrollWidth - window.innerWidth);
    gsap.to(strip, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap, start: "center center", end: () => "+=" + distance(),
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
  }

  /* ---------- custom cursor (desktop) ---------- */
  if (desktop) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    ring.innerHTML = "<span>View</span>";
    document.body.append(ring, dot);
    document.documentElement.classList.add("has-cursor");

    const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
    const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      document.documentElement.classList.add("cursor-on");
    }, { passive: true });
    document.addEventListener("mouseleave", () => document.documentElement.classList.remove("cursor-on"));

    document.addEventListener("mouseover", (e) => {
      const t = e.target;
      ring.classList.toggle("is-view", !!t.closest(".g-item"));
      ring.classList.toggle("is-link", !t.closest(".g-item") && !!t.closest("a, button, [role='tab']"));
    });
  }

  /* ---------- magnetic buttons (desktop) ---------- */
  if (desktop) {
    document.querySelectorAll("main .btn-gold, main .btn-dark").forEach((btn) => {
      btn.classList.add("is-magnetic");
      const mx = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      const my = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.25);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ---------- keep positions right when the page height changes ---------- */
  // refresh after the gallery finishes growing or shrinking (keeps the scroll position)
  let t;
  window.addEventListener("gallery:change", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const y = window.scrollY;
      ScrollTrigger.refresh();
      if (Math.abs(window.scrollY - y) > 1) (lenis ? lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y));
    }, 800);
  });
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();

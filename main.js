(() => {
  "use strict";

  // =========================================================
  // Config
  // =========================================================
  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const CFG = {
    // Beams
    beam: {
      driftSpeed: 0.0016,
      sineX: 86,
      sineY: 64,
      mouseX: 38,
      mouseY: 26,
      scrollVX: 0.16,
      scrollVY: -0.08,
      velClamp: 70,
    },
    // Cursor spotlight
    spotlight: {
      enabled: true,
      radius: 520,        // px
      strength: 0.12,     // opacity
      ease: 0.10,         // 0..1, higher = snappier
    },
    // Magnetic buttons (subtle)
    magnet: {
      enabled: true,
      strength: 14,       // px offset at edge
      scale: 1.01,
    },
    // Inertial scroll (very subtle; avoids "cheap" feel)
    scroll: {
      enabled: true,
      ease: 0.14,         // 0..1
    }
  };

  // =========================================================
  // Helpers
  // =========================================================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  // =========================================================
  // Footer year
  // =========================================================
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =========================================================
  // Mobile drawer
  // =========================================================
  const menuBtn = $(".menu");
  const drawer = $("[data-drawer]");
  const setDrawer = (open) => {
    if (!drawer || !menuBtn) return;
    drawer.setAttribute("data-open", open ? "true" : "false");
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };

  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      const open = drawer.getAttribute("data-open") === "true";
      setDrawer(!open);
    });
    drawer.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) setDrawer(false);
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setDrawer(false);
    });
  }

  // =========================================================
  // Smooth anchors with header offset
  // =========================================================
  const header = $(".header");
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const y =
      window.scrollY + target.getBoundingClientRect().top - headerH() - 12;
    window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
  });

  // =========================================================
  // Header shadow (premium depth cue)
  // =========================================================
  const headerEl = $(".header");
  const applyHeaderShadow = () => {
    if (!headerEl) return;
    const y = window.scrollY || 0;
    headerEl.style.boxShadow =
      y > 8 ? "0 14px 45px rgba(10,18,32,.07)" : "none";
  };
  applyHeaderShadow();
  window.addEventListener("scroll", applyHeaderShadow, { passive: true });

  // =========================================================
  // Reveal on scroll (subtle)
  // =========================================================
  const reveals = $$(".reveal");
  if (!prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );

    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // =========================================================
  // Tilt cards (glass / contact card)
  // =========================================================
  const tiltEls = $$("[data-tilt]");
  const tiltStrength = 10;

  const tiltMove = (el, ev) => {
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    const rx = (0.5 - py) * tiltStrength;
    const ry = (px - 0.5) * tiltStrength;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
  };
  const tiltReset = (el) => {
    el.style.transform =
      "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  };

  if (!prefersReduced) {
    tiltEls.forEach((el) => {
      let inside = false;
      el.addEventListener("mouseenter", () => {
        inside = true;
        el.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)";
      });
      el.addEventListener("mousemove", (ev) => {
        if (!inside) return;
        el.style.transition = "transform .08s linear";
        tiltMove(el, ev);
      });
      el.addEventListener("mouseleave", () => {
        inside = false;
        el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
        tiltReset(el);
      });
    });
  }

  // =========================================================
  // Nav indicator that tracks current section + hover
  // =========================================================
  const nav = $(".nav");
  const indicator = $(".nav__indicator");
  const navLinks = $$(".nav__link");

  const placeIndicator = (link) => {
    if (!nav || !indicator || !link) return;
    const navRect = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const x = r.left - navRect.left;
    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.width = `${r.width}px`;
    indicator.style.opacity = "0.95";
  };

  if (navLinks.length) placeIndicator(navLinks[0]);

  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!prefersReduced && "IntersectionObserver" in window && sections.length) {
    const map = new Map();
    sections.forEach((sec, i) => map.set(sec, navLinks[i]));

    const nio = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) placeIndicator(map.get(visible.target));
      },
      { threshold: [0.25, 0.4, 0.6], rootMargin: "-15% 0px -60% 0px" }
    );

    sections.forEach((sec) => nio.observe(sec));
  }

  navLinks.forEach((a) => {
    a.addEventListener("mouseenter", () => placeIndicator(a));
  });

  // =========================================================
  // Cursor spotlight (luxury "alive" layer)
  // - uses CSS variables on body, no extra DOM needed
  // =========================================================
  let cx = window.innerWidth * 0.5;
  let cy = window.innerHeight * 0.3;
  let tx = cx, ty = cy;

  const setSpotlightVars = () => {
    document.documentElement.style.setProperty("--cx", `${cx}px`);
    document.documentElement.style.setProperty("--cy", `${cy}px`);
  };

  const onMouseMove = (e) => {
    tx = e.clientX;
    ty = e.clientY;
  };

  if (!prefersReduced && CFG.spotlight.enabled) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    setSpotlightVars();
  }

  // =========================================================
  // Beam parallax + drift (mouse + scroll velocity)
  // =========================================================
  const beams = $$(".beam");
  let mx = 0,
    my = 0,
    lastY = window.scrollY || 0,
    t = 0;

  const onMouseMove2 = (e) => {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    mx = e.clientX / vw - 0.5;
    my = e.clientY / vh - 0.5;
  };

  if (!prefersReduced) {
    window.addEventListener("mousemove", onMouseMove2, { passive: true });
  }

  const baseRot = (beam, i) => {
    if (beam.classList.contains("beam--1")) return -18;
    if (beam.classList.contains("beam--2")) return -12;
    if (beam.classList.contains("beam--3")) return -22;
    return -16 - i * 3;
  };

  // =========================================================
  // Magnetic buttons (subtle, expensive)
  // =========================================================
  const magnets = CFG.magnet.enabled ? $$(".btn") : [];
  const magnetState = new Map();

  const magnetEnter = (el) => {
    magnetState.set(el, { x: 0, y: 0, inside: true });
    el.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)";
  };
  const magnetLeave = (el) => {
    magnetState.set(el, { x: 0, y: 0, inside: false });
    el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
    el.style.transform = "translate(0px, 0px) scale(1)";
  };
  const magnetMove = (el, ev) => {
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - 0.5;
    const py = (ev.clientY - r.top) / r.height - 0.5;

    const x = px * CFG.magnet.strength;
    const y = py * CFG.magnet.strength;

    el.style.transition = "transform .08s linear";
    el.style.transform = `translate(${x}px, ${y}px) scale(${CFG.magnet.scale})`;
  };

  if (!prefersReduced && magnets.length) {
    magnets.forEach((el) => {
      el.addEventListener("mouseenter", () => magnetEnter(el));
      el.addEventListener("mouseleave", () => magnetLeave(el));
      el.addEventListener("mousemove", (ev) => magnetMove(el, ev));
    });
  }

  // =========================================================
  // Main RAF loop (one loop to rule them all)
  // - updates spotlight smoothing
  // - updates beams drift/parallax
  // =========================================================
  let raf = 0;
  const tick = () => {
    raf = 0;
    if (prefersReduced) return;

    // Spotlight smoothing
    if (CFG.spotlight.enabled) {
      cx = lerp(cx, tx, CFG.spotlight.ease);
      cy = lerp(cy, ty, CFG.spotlight.ease);
      setSpotlightVars();
    }

    // Beams
    if (beams.length) {
      t += CFG.beam.driftSpeed;

      const y = window.scrollY || 0;
      const dy = y - lastY;
      lastY = y;

      const vel = clamp(dy, -CFG.beam.velClamp, CFG.beam.velClamp);

      beams.forEach((beam, i) => {
        const sx = Math.sin(t + i * 1.2) * CFG.beam.sineX;
        const sy = Math.cos(t * 0.9 + i * 0.85) * CFG.beam.sineY;

        const px = mx * CFG.beam.mouseX;
        const py = my * CFG.beam.mouseY;

        const vx = vel * CFG.beam.scrollVX;
        const vy = vel * CFG.beam.scrollVY;

        const x = sx + px + vx;
        const y2 = sy + py + vy;

        beam.style.transform = `translate(${x}px, ${y2}px) rotate(${baseRot(
          beam,
          i
        )}deg)`;
      });
    }

    raf = requestAnimationFrame(tick);
  };

  if (!prefersReduced) {
    // Kick off loop
    tick();

    // Restart on tab focus
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && !raf) tick();
    });
  }

  // =========================================================
  // Subtle inertial scroll feel (optional but "expensive")
  // - This does not hijack scroll; it only smooths wheel delta a bit.
  // =========================================================
  if (!prefersReduced && CFG.scroll.enabled) {
    let targetY = window.scrollY || 0;
    let currentY = targetY;
    let scrolling = false;

    const onWheel = (e) => {
      // Only apply to non-touchpad aggressive wheel events
      // If user holds ctrl (zoom) or uses trackpad micro scroll, skip.
      if (e.ctrlKey) return;
      const delta = e.deltaY;
      if (Math.abs(delta) < 6) return;

      targetY += delta;
      targetY = clamp(
        targetY,
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      if (!scrolling) {
        scrolling = true;
        requestAnimationFrame(step);
      }
    };

    const step = () => {
      currentY = lerp(currentY, targetY, CFG.scroll.ease);
      window.scrollTo(0, currentY);

      if (Math.abs(currentY - targetY) > 0.6) {
        requestAnimationFrame(step);
      } else {
        scrolling = false;
      }
    };

    // Passive false is required if we ever preventDefault.
    // We do NOT preventDefault here; we just smooth when deltas are large.
    window.addEventListener("wheel", onWheel, { passive: true });
  }
})();

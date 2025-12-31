// main.js
(() => {
  "use strict";

  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Drawer (mobile)
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

  // Smooth anchor with sticky header offset (NO scroll hijacking)
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
    const y = window.scrollY + target.getBoundingClientRect().top - headerH() - 12;
    window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
  });

  // Header shadow on scroll
  const headerEl = $(".header");
  const applyHeaderShadow = () => {
    if (!headerEl) return;
    const y = window.scrollY || 0;
    headerEl.style.boxShadow = y > 8 ? "0 14px 45px rgba(10,18,32,.07)" : "none";
  };
  applyHeaderShadow();
  window.addEventListener("scroll", applyHeaderShadow, { passive: true });

  // Nav indicator (kept, you liked it)
  const nav = $(".nav");
  const indicator = $(".nav__indicator");
  const navLinks = $$(".nav__link");

  const placeIndicator = (link) => {
    if (!nav || !indicator || !link) return;
    const navRect = nav.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    indicator.style.transform = `translateX(${r.left - navRect.left}px)`;
    indicator.style.width = `${r.width}px`;
    indicator.style.opacity = "0.95";
  };

  if (navLinks.length) placeIndicator(navLinks[0]);

  // Track section in view (no fades, just nav polish)
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (!prefersReduced && "IntersectionObserver" in window && sections.length) {
    const map = new Map();
    sections.forEach((sec, i) => map.set(sec, navLinks[i]));

    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) placeIndicator(map.get(visible.target));
    }, { threshold: [0.25, 0.5], rootMargin: "-15% 0px -60% 0px" });

    sections.forEach(sec => io.observe(sec));
  }

  navLinks.forEach((a) => a.addEventListener("mouseenter", () => placeIndicator(a)));
  nav?.addEventListener("mouseleave", () => placeIndicator(navLinks[0] || null));

  // Tilt (kept, you liked it) — applies to anything with data-tilt
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
    el.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
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

  // Cursor spotlight (luxury layer)
  let cx = window.innerWidth * 0.5;
  let cy = window.innerHeight * 0.22;
  let tx = cx, ty = cy;

  const setSpot = () => {
    document.documentElement.style.setProperty("--cx", `${cx}px`);
    document.documentElement.style.setProperty("--cy", `${cy}px`);
  };

  const onMouse = (e) => { tx = e.clientX; ty = e.clientY; };

  if (!prefersReduced) {
    window.addEventListener("mousemove", onMouse, { passive: true });
    setSpot();
  }

  // Beams drift + parallax (global, not per section)
  const beams = $$(".beam");
  const baseRot = (beam, i) => {
    if (beam.classList.contains("beam--1")) return -18;
    if (beam.classList.contains("beam--2")) return -12;
    if (beam.classList.contains("beam--3")) return -22;
    if (beam.classList.contains("beam--4")) return -16;
    return -16 - i * 2;
  };

  let mx = 0, my = 0, lastY = window.scrollY || 0, t = 0;
  const onMouse2 = (e) => {
    const vw = Math.max(1, window.innerWidth);
    const vh = Math.max(1, window.innerHeight);
    mx = (e.clientX / vw) - 0.5;
    my = (e.clientY / vh) - 0.5;
  };
  if (!prefersReduced) window.addEventListener("mousemove", onMouse2, { passive: true });

  let raf = 0;
  const tick = () => {
    raf = 0;
    if (prefersReduced) return;

    // spotlight ease
    cx += (tx - cx) * 0.10;
    cy += (ty - cy) * 0.10;
    setSpot();

    // beams
    if (beams.length) {
      t += 0.0016;

      const y = window.scrollY || 0;
      const dy = y - lastY;
      lastY = y;
      const vel = clamp(dy, -70, 70);

      beams.forEach((beam, i) => {
        const sx = Math.sin(t + i * 1.15) * 86;
        const sy = Math.cos(t * 0.9 + i * 0.85) * 64;

        const px = mx * 38;
        const py = my * 26;

        const vx = vel * 0.16;
        const vy = vel * -0.08;

        const x = sx + px + vx;
        const y2 = sy + py + vy;

        beam.style.transform = `translate(${x}px, ${y2}px) rotate(${baseRot(beam, i)}deg)`;
      });
    }

    raf = requestAnimationFrame(tick);
  };

  if (!prefersReduced) tick();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !raf && !prefersReduced) tick();
  });
})();

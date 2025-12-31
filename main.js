// script.js (REPLACE ENTIRE FILE WITH THIS)
(() => {
  "use strict";

  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // -----------------------------
  // Footer year
  // -----------------------------
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // -----------------------------
  // Mobile drawer (safe even if you don't have it)
  // - Works with:
  //   button.menu
  //   [data-drawer] container
  //   drawer links inside
  // -----------------------------
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

  // -----------------------------
  // Smooth anchor scrolling with sticky header offset
  // - Works for: <a href="#section">
  // - Prevents jump + accounts for fixed/sticky header height
  // -----------------------------
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

  // -----------------------------
  // Header shadow on scroll (light luxury touch)
  // - No infinite RAF loop; only updates on scroll + on load
  // -----------------------------
  const headerEl = $(".header");
  const applyHeaderShadow = () => {
    if (!headerEl) return;
    const y = window.scrollY || 0;
    headerEl.style.boxShadow = y > 6 ? "0 12px 40px rgba(10,18,32,.06)" : "none";
  };

  applyHeaderShadow();
  window.addEventListener("scroll", applyHeaderShadow, { passive: true });

  // -----------------------------
  // BEAM animation
  // Requirements:
  // - HTML contains:
  //   <div class="beams">
  //     <span class="beam beam--1"></span>
  //     <span class="beam beam--2"></span>
  //     <span class="beam beam--3"></span>
  //   </div>
  //
  // Notes:
  // - CSS already provides animation: beamMove
  // - This JS adds subtle "drift" to feel premium.
  // - If prefers-reduced-motion, we keep CSS as-is and skip drift.
  // -----------------------------
  const beams = $$(".beam");

  // If beams don't exist, do nothing (prevents errors)
  if (beams.length) {
    // Give each beam a stable base rotation derived from its class if present
    // so even if CSS changes, JS keeps consistent angles.
    const baseRot = beams.map((b, i) => {
      // match your CSS: -18, -12, -22; fallback pattern
      if (b.classList.contains("beam--1")) return -18;
      if (b.classList.contains("beam--2")) return -12;
      if (b.classList.contains("beam--3")) return -22;
      return -16 - i * 3;
    });

    // Optional: small parallax based on mouse position (desktop only)
    // Very subtle; feels expensive. Disabled for reduced motion.
    let mx = 0, my = 0;
    const onMouseMove = (e) => {
      const vw = Math.max(1, window.innerWidth);
      const vh = Math.max(1, window.innerHeight);
      // normalize -0.5..0.5
      mx = (e.clientX / vw) - 0.5;
      my = (e.clientY / vh) - 0.5;
    };

    if (!prefersReduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
    }

    // Drift loop
    let t = 0;
    let rafId = 0;

    const animateBeams = () => {
      rafId = 0;
      if (prefersReduced) return; // stop drift if reduced motion

      t += 0.0018;

      // Scroll velocity micro influence (quiet, no jank)
      // Uses lastY and current scroll to add tiny response to user movement.
      const y = window.scrollY || 0;
      animateBeams.lastY ??= y;
      const dy = y - animateBeams.lastY;
      animateBeams.lastY = y;

      const vel = clamp(dy, -60, 60);

      beams.forEach((beam, i) => {
        // smooth sine drift
        const sx = Math.sin(t + i * 1.25) * 90;
        const sy = Math.cos(t * 0.85 + i * 0.9) * 70;

        // mouse parallax (very subtle)
        const px = mx * 28;
        const py = my * 18;

        // scroll velocity response (tiny)
        const vx = vel * 0.18;
        const vy = vel * -0.10;

        const x = sx + px + vx;
        const y2 = sy + py + vy;

        // keep the rotation stable and elegant
        const r = baseRot[i];

        beam.style.transform = `translate(${x}px, ${y2}px) rotate(${r}deg)`;
      });

      rafId = requestAnimationFrame(animateBeams);
    };

    if (!prefersReduced) {
      // Kick it off
      animateBeams();
      // Also restart on tab focus (some browsers throttle RAF)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && !rafId && !prefersReduced) {
          animateBeams();
        }
      });
    }
  }

  // -----------------------------
  // Safety: if someone loads script in <head>, wait for DOM
  // (not necessary if your script tag is at bottom, but harmless)
  // -----------------------------
})();

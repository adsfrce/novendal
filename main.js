// script.js
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile drawer
  const menuBtn = document.querySelector(".menu");
  const drawer = document.querySelector("[data-drawer]");
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

  // Smooth anchor (better than CSS alone for offset with sticky header)
  const header = document.querySelector(".header");
  const headerH = () => (header ? header.getBoundingClientRect().height : 0);

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    const y = window.scrollY + target.getBoundingClientRect().top - headerH() - 10;

    window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
  });

  // Reveal on scroll
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (!prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-in");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );

    reveals.forEach((el, i) => {
      // subtle stagger using transition delay
      el.style.transitionDelay = `${Math.min(i * 60, 360)}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const y = window.scrollY;
      const d = y - lastY;
      lastY = y;

      // normalized scroll progress 0..1-ish
      const docH = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = y / docH;

      // Subtle drift; rare accent usage = keep it quiet
      const ax = Math.sin(p * Math.PI * 2) * 30;
      const ay = (p - 0.5) * 120;

      const bx = Math.cos(p * Math.PI * 2) * 26;
      const by = (0.5 - p) * 110;

      const cx = Math.sin(p * Math.PI * 4) * 18;
      const cy = (p - 0.5) * 140;

      // extra micro drift from scroll velocity (d)
      const vel = clamp(d, -40, 40);

      setGlow(glowA, ax + vel * 0.35, ay - vel * 0.2);
      setGlow(glowB, bx - vel * 0.25, by + vel * 0.25);
      setGlow(glowC, cx + vel * 0.15, cy + vel * 0.15);
    });
  };

  if (!prefersReduced) {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Premium tilt interaction on card
  const tiltEls = Array.from(document.querySelectorAll("[data-tilt]"));
  const tiltStrength = 10; // degrees max

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

  // Improve feel: subtle header shadow after scroll
  const headerEl = document.querySelector(".header");
  if (headerEl && !prefersReduced) {
    const tick = () => {
      const y = window.scrollY;
      headerEl.style.boxShadow = y > 6 ? "0 12px 40px rgba(10,18,32,.06)" : "none";
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();

/* BEAM ANIMATION */
const beams = document.querySelectorAll(".beam");
let t = 0;

function animateBeams() {
  t += 0.0018;

  beams.forEach((beam, i) => {
    const x = Math.sin(t + i * 1.3) * 80;
    const y = Math.cos(t * 0.8 + i) * 60;
    const r = -18 - i * 4;

    beam.style.transform =
      `translate(${x}px, ${y}px) rotate(${r}deg)`;
  });

  requestAnimationFrame(animateBeams);
}

animateBeams();

/* FOOTER YEAR */
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

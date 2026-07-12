import { heroMotion, routeDraw } from "./motion.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hero = document.querySelector("[data-apple-hero]");
const routeVisual = document.querySelector("[data-route-visual]");

const setProgress = (element, value) => {
  element?.style.setProperty("--progress", String(value));
};

const update = () => {
  if (hero) {
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / Math.max(rect.height * 0.78, 1), 0), 1);
    const values = heroMotion(progress, reduceMotion);
    hero.style.setProperty("--hero-scale", String(values.imageScale));
    hero.style.setProperty("--light-y", `${values.lightOffsetY}px`);
    hero.style.setProperty("--light-opacity", String(values.lightOpacity));
  }

  if (routeVisual) {
    const rect = routeVisual.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const progress = Math.min(Math.max((viewport * 0.8 - rect.top) / (rect.height * 0.9), 0), 1);
    const values = routeDraw(progress, reduceMotion);
    setProgress(routeVisual, values.pathProgress);
    routeVisual.classList.toggle("is-route-complete", values.labelVisible);
  }
};

let ticking = false;
const requestUpdate = () => {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(() => {
    update();
    ticking = false;
  });
};

update();
window.addEventListener("scroll", requestUpdate, { passive: true });
window.addEventListener("resize", requestUpdate);

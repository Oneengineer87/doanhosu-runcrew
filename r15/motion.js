(() => {
  const root = document.documentElement;
  const body = document.body;
  const menu = document.getElementById("site-menu");
  const toggle = document.querySelector(".menu-toggle");
  const closeButton = document.querySelector("[data-menu-close]");
  const menuLinks = [...document.querySelectorAll(".menu-panel a")];
  const progress = document.querySelector(".scroll-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let menuOpen = false;
  let scrollTicking = false;

  const setMenu = (open, restoreFocus = true) => {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menu.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    body.classList.toggle("menu-open", open);

    if (open) {
      window.setTimeout(() => menuLinks[0]?.focus(), reduceMotion ? 0 : 180);
    } else if (restoreFocus) {
      toggle.focus();
    }
  };

  const revealPassedContent = () => {
    if (reduceMotion) return;
    const revealLimit = window.innerHeight * 1.02;

    document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((item) => {
      if (item.getBoundingClientRect().top < revealLimit) {
        item.classList.add("is-visible");
      }
    });

    document.querySelectorAll("[data-timeline]:not(.timeline-active)").forEach((item) => {
      if (item.getBoundingClientRect().top < revealLimit) {
        item.classList.add("timeline-active");
      }
    });

    const stage = document.querySelector(".schedule-stage");
    if (stage && stage.getBoundingClientRect().top < revealLimit) {
      stage.classList.add("route-active");
    }
  };

  menu.inert = true;
  toggle.addEventListener("click", () => setMenu(!menuOpen));
  closeButton.addEventListener("click", () => setMenu(false));
  menuLinks.forEach((link) => link.addEventListener("click", () => setMenu(false, false)));

  document.addEventListener("keydown", (event) => {
    if (!menuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [toggle, ...menuLinks];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = `scaleX(${value})`;
    revealPassedContent();
    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateProgress);
      scrollTicking = true;
    }
  }, { passive: true });
  updateProgress();

  if (!reduceMotion && "IntersectionObserver" in window) {
    root.classList.add("motion-ready");
    const revealItems = document.querySelectorAll("[data-reveal]");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -5% 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));

    const timelineItems = document.querySelectorAll("[data-timeline]");
    const timelineObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
        entry.target.classList.add("timeline-active");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.42 });
    timelineItems.forEach((item) => timelineObserver.observe(item));

    const scheduleStage = document.querySelector(".schedule-stage");
    const routeObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting && entries[0].boundingClientRect.top >= 0) return;
      scheduleStage.classList.add("route-active");
      observer.disconnect();
    }, { threshold: 0.2 });
    routeObserver.observe(scheduleStage);
    revealPassedContent();
  } else {
    document.querySelector(".schedule-stage")?.classList.add("route-active");
    document.querySelectorAll("[data-timeline]").forEach((item) => item.classList.add("timeline-active"));
  }

  const faqItems = [...document.querySelectorAll(".faq-list details")];
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();

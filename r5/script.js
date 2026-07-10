document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const pageContent = document.querySelector("main");
  const pageFooter = document.querySelector(".site-footer");

  const setBackgroundInert = (value) => {
    [pageContent, pageFooter].forEach((element) => {
      if (element) element.inert = value;
    });
  };

  const closeMenu = (restoreFocus = false) => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "메뉴 열기");
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    setBackgroundInert(false);
    if (restoreFocus) menuButton.focus();
  };

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.setAttribute("aria-label", willOpen ? "메뉴 닫기" : "메뉴 열기");
      mobileNav.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
      setBackgroundInert(willOpen);
      if (willOpen) {
        window.requestAnimationFrame(() => mobileNav.querySelector("a")?.focus());
      }
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
        closeMenu(true);
      }

      if (event.key === "Tab" && mobileNav.classList.contains("is-open")) {
        const focusable = [...mobileNav.querySelectorAll("a[href]")];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    window.matchMedia("(min-width: 921px)").addEventListener("change", (event) => {
      if (event.matches) closeMenu(false);
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6%" }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  const toast = document.querySelector("[data-toast]");
  let toastTimer;

  document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (!toast) return;
      toast.textContent = "테스트 버전입니다. 실제 채널 링크는 배포 전에 연결합니다.";
      toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
    });
  });
});

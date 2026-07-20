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
    if (scheduleStage) {
      const routeObserver = new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting && entries[0].boundingClientRect.top >= 0) return;
        scheduleStage.classList.add("route-active");
        observer.disconnect();
      }, { threshold: 0.2 });
      routeObserver.observe(scheduleStage);
    }
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

  const shoeFilters = [...document.querySelectorAll("[data-shoe-filter]")];
  const shoeRows = [...document.querySelectorAll("[data-shoe-cat]")];
  shoeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.shoeFilter;
      shoeFilters.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      shoeRows.forEach((row) => {
        row.classList.toggle("is-hidden", target !== "all" && row.dataset.shoeCat !== target);
      });
    });
  });

  const getDecimalPlaces = (value) => {
    const decimal = String(value).split(".")[1];
    return decimal ? Math.min(decimal.length, 2) : 0;
  };

  const formatNumber = (value, decimals = getDecimalPlaces(value)) => {
    const number = Number(value) || 0;
    return decimals === 0
      ? number.toLocaleString("ko-KR")
      : number.toLocaleString("ko-KR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const animateNumber = (element, value, options = {}) => {
    const target = Number(value) || 0;
    const decimals = getDecimalPlaces(value);
    element.dataset.finalValue = String(target);

    if (reduceMotion) {
      element.textContent = formatNumber(target, decimals);
      return;
    }

    const replay = options.replay === true;
    const duration = replay ? 680 : (element.dataset.statNumber === "totalKm" ? 1450 : 1050);
    const startValue = replay ? target * 0.965 : 0;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatNumber(startValue + ((target - startValue) * eased), decimals);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  };

  const runStatsAnimation = (numbers, stats, options = {}) => {
    numbers.forEach((item) => animateNumber(item, stats[item.dataset.statNumber], options));
  };

  const loadRunStats = async () => {
    const numbers = [...document.querySelectorAll("[data-stat-number]")];
    if (!numbers.length) return;
    const runStatsSection = document.querySelector(".run-stats");
    let stats = {};

    try {
      const response = await fetch("data/run-stats.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`run stats ${response.status}`);
      stats = await response.json();

      document.querySelector("[data-stat-label]").textContent = stats.label || "테스트 운영 중";
      document.querySelector("[data-stat-note]").textContent = stats.note || "운영진이 정기적으로 업데이트합니다.";

      const updated = document.querySelector("[data-stat-updated]");
      if (stats.updatedAt && updated) {
        const date = new Date(`${stats.updatedAt}T00:00:00`);
        updated.dateTime = stats.updatedAt;
        updated.textContent = Number.isNaN(date.valueOf())
          ? stats.updatedAt
          : date.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
      }
    } catch {
      numbers.forEach((item) => {
        stats[item.dataset.statNumber] = item.textContent;
      });
    }

    const revealNumbers = () => {
      const animated = runStatsSection?.dataset.statsAnimated === "true";
      if (runStatsSection) runStatsSection.dataset.statsAnimated = "true";
      runStatsAnimation(numbers, stats, { replay: animated });
    };

    if (reduceMotion || !runStatsSection || !("IntersectionObserver" in window)) {
      revealNumbers();
      return;
    }

    let lastReplayAt = 0;
    const statObserver = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      const now = Date.now();
      const animated = runStatsSection?.dataset.statsAnimated === "true";
      if (animated && now - lastReplayAt < 1600) return;
      lastReplayAt = now;
      revealNumbers();
    }, { threshold: 0.36, rootMargin: "0px 0px -12% 0px" });

    statObserver.observe(runStatsSection);
  };

  loadRunStats();
})();

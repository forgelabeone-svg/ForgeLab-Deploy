(function () {
  const STORAGE_KEY = "theme";
  const themeToggle = document.getElementById("themeToggle");
  const yearEl = document.getElementById("year");
  const clockEl = document.getElementById("clock");
  const statusBadge = document.getElementById("statusBadge");
  const lastAction = document.getElementById("lastAction");

  const statVisitors = document.getElementById("statVisitors");
  const statDownloads = document.getElementById("statDownloads");
  const statStars = document.getElementById("statStars");

  const randomizeBtn = document.getElementById("randomizeBtn");
  const refreshStatsBtn = document.getElementById("refreshStatsBtn");
  const resetStatsBtn = document.getElementById("resetStatsBtn");

  const contactForm = document.getElementById("contactForm");
  const toast = document.getElementById("formToast");
  const submitBtn = document.getElementById("submitBtn");

  let clockTimer = null;

  function setLastAction(text) {
    if (!lastAction) return;
    lastAction.textContent = text;
  }

  function setStatus(type, text) {
    if (!statusBadge) return;
    statusBadge.classList.remove("badge-ok", "badge-warn", "badge-bad");
    if (type === "ok") statusBadge.classList.add("badge-ok");
    if (type === "warn") statusBadge.classList.add("badge-warn");
    if (type === "bad") statusBadge.classList.add("badge-bad");
    statusBadge.textContent = text;
  }

  function formatNumber(n) {
    return new Intl.NumberFormat("hu-HU").format(n);
  }

  function animateCounter(el, to, duration = 450) {
    const from = Number(el.textContent.replace(/\s/g, "").replace(/\D/g, "")) || 0;
    const start = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      el.textContent = formatNumber(value);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function randomStats() {
    return {
      visitors: 500 + Math.floor(Math.random() * 4500),
      downloads: 20 + Math.floor(Math.random() * 280),
      stars: 5 + Math.floor(Math.random() * 95)
    };
  }

  function applyStats(stats) {
    if (statVisitors) animateCounter(statVisitors, stats.visitors);
    if (statDownloads) animateCounter(statDownloads, stats.downloads);
    if (statStars) animateCounter(statStars, stats.stars);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
      const isLight = theme === "light";
      themeToggle.setAttribute("aria-pressed", String(isLight));
      themeToggle.textContent = isLight ? "Sötét mód" : "Világos mód";
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
    setLastAction("Téma váltás");
  }

  function setClock() {
    if (!clockEl) return;
    const d = new Date();
    const txt = d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    clockEl.textContent = txt;
  }

  function showToast(message, type = "ok") {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");

    toast.style.borderColor =
      type === "ok" ? "rgba(34,197,94,0.5)" : type === "warn" ? "rgba(245,158,11,0.55)" : "rgba(239,68,68,0.55)";

    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("show");
    }, 2400);
  }

  function setFieldError(fieldName, message) {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message || "";
  }

  function validateContactForm(formData) {
    let ok = true;

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    setFieldError("name", "");
    setFieldError("email", "");
    setFieldError("message", "");

    if (name.length < 2) {
      setFieldError("name", "Adj meg legalább 2 karaktert.");
      ok = false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError("email", "Adj meg egy érvényes email címet.");
      ok = false;
    }

    if (message.length < 10) {
      setFieldError("message", "Az üzenet legyen legalább 10 karakter.");
      ok = false;
    }

    return ok;
  }

  function wireCardActions() {
    document.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => {
        const action = el.getAttribute("data-action");
        if (action === "theme") toggleTheme();
        if (action === "stats") setLastAction("Navigáció: Statisztika");
        if (action === "contact") setLastAction("Navigáció: Kapcsolat");
      });
    });
  }

  function init() {
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    applyTheme(getPreferredTheme());
    if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

    setClock();
    clockTimer = setInterval(setClock, 1000);

    applyStats(randomStats());

    if (randomizeBtn) {
      randomizeBtn.addEventListener("click", () => {
        applyStats(randomStats());
        setStatus("ok", "OK");
        setLastAction("Véletlen statisztika");
      });
    }

    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener("click", () => {
        applyStats(randomStats());
        setStatus("ok", "OK");
        setLastAction("Statisztika frissítve");
      });
    }

    if (resetStatsBtn) {
      resetStatsBtn.addEventListener("click", () => {
        applyStats({ visitors: 0, downloads: 0, stars: 0 });
        setStatus("warn", "RESET");
        setLastAction("Statisztika nullázva");
      });
    }

    wireCardActions();

    if (contactForm) {
      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setStatus("ok", "OK");

        const formData = new FormData(contactForm);
        const ok = validateContactForm(formData);

        if (!ok) {
          setStatus("bad", "HIBA");
          showToast("Javítsd az űrlap hibáit.", "bad");
          setLastAction("Űrlap: validációs hiba");
          return;
        }

        submitBtn && (submitBtn.disabled = true);
        setStatus("warn", "KÜLDÉS");

        await new Promise((r) => setTimeout(r, 650));

        submitBtn && (submitBtn.disabled = false);
        contactForm.reset();

        setStatus("ok", "ELKÜLDVE");
        showToast("Üzenet elküldve (szimuláció).", "ok");
        setLastAction("Űrlap: elküldve");
      });

      contactForm.addEventListener("reset", () => {
        setFieldError("name", "");
        setFieldError("email", "");
        setFieldError("message", "");
        setStatus("ok", "OK");
        setLastAction("Űrlap törölve");
      });
    }
  }

  init();

  window.addEventListener("beforeunload", () => {
    if (clockTimer) clearInterval(clockTimer);
  });
})();
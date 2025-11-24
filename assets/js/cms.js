\
/* assets/js/cms.js */
(function () {
  // Do not run inside CMS admin
  if (location.pathname.startsWith("/admin")) return;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const cacheBust = () => "?cache=" + Date.now();

  function get(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  async function fetchJSON(path) {
    const res = await fetch(path + cacheBust(), { cache: "no-store" });
    if (!res.ok) throw new Error("Fetch " + res.status + ": " + path);
    return res.json();
  }

  const PAGE_MAP = {
    "/": "home",
    "/index.html": "home",
    "/about.html": "about",
    "/contact.html": "contact",
    "/stores.html": "stores",
    "/store-charlton-kings.html": "store-charlton-kings",
    "/store-mx.html": "store-mx",
    "/store-site.html": "store-site",
    "/moosh.html": "moosh"
  };

  function getPageKey() {
    const body = document.body;
    if (!body) return null;

    if (body.dataset.page) return body.dataset.page;

    const path = location.pathname.replace(/\/+$/, "") || "/";
    return PAGE_MAP[path] || null;
  }

  async function hydrate() {
    const pageKey = getPageKey();
    if (!pageKey) return;

    let settings = {};
    try {
      settings = await fetchJSON("/src/content/settings/site.json");
    } catch (e) {
      console.warn("[CMS] Settings JSON missing:", e.message);
    }

    let page = {};
    try {
      page = await fetchJSON("/src/content/pages/" + pageKey + ".json");
    } catch (e) {
      console.warn("[CMS] Page JSON missing:", pageKey, e.message);
    }

    // 1. Document title (SEO)
    if (page.seo && page.seo.title) {
      document.title = page.seo.title;
    } else if (page.title && settings.siteTitle) {
      document.title = page.title + " | " + settings.siteTitle;
    } else if (page.title) {
      document.title = page.title;
    } else if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }

    // 2. Basic title / subtitle / body (fallback selectors)
    const titleEl = q("#page-title, #home-title, main h1, h1");
    const subtitleEl = q("#page-subtitle, #home-subtitle, main h2, h2");
    const bodyEl = q("#page-body, #home-body, main p");

    if (titleEl && (page.title || settings.siteTitle)) {
      titleEl.textContent = page.title || settings.siteTitle;
    }

    if (subtitleEl && page.subtitle) {
      subtitleEl.textContent = page.subtitle;
    }

    if (bodyEl && page.body) {
      bodyEl.innerHTML = page.body;
    }

    // 3. Hero image swap (if you want to bind it)
    if (page.heroImage) {
      const heroImg =
        q("[data-hero-image]") || q(".hero img") || q(".hero-image img");
      if (heroImg) {
        heroImg.src = page.heroImage;
      }
    }

    // 4. Generic text bindings
    qa("[data-cms-text]").forEach((el) => {
      const path = el.getAttribute("data-cms-text");
      const value = get({ settings, page }, path);
      if (value !== undefined) el.textContent = value;
    });

    // 5. Generic HTML bindings
    qa("[data-cms-html]").forEach((el) => {
      const path = el.getAttribute("data-cms-html");
      const value = get({ settings, page }, path);
      if (value !== undefined) el.innerHTML = value;
    });

    // 6. Attribute bindings: data-cms-attr="href:page.cta.link"
    qa("[data-cms-attr]").forEach((el) => {
      const raw = el.getAttribute("data-cms-attr");
      if (!raw) return;
      const parts = raw.split(":");
      if (parts.length < 2) return;
      const attr = parts[0].trim();
      const path = parts.slice(1).join(":").trim();
      if (!attr || !path) return;
      const value = get({ settings, page }, path);
      if (value !== undefined) el.setAttribute(attr, value);
    });

    // 7. Small debug badge (local/dev only)
    if (location.hostname === "localhost" || location.search.includes("cmsDebug")) {
      const badge = document.createElement("div");
      badge.textContent = "CMS: " + pageKey;
      Object.assign(badge.style, {
        position: "fixed",
        right: "12px",
        bottom: "12px",
        background: "#a0e75a",
        color: "#000",
        padding: "6px 10px",
        borderRadius: "8px",
        font: "12px system-ui",
        zIndex: 9999
      });
      document.body.appendChild(badge);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrate);
  } else {
    hydrate();
  }
})();

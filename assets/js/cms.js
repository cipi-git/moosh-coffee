(function () {
  // 1. Ignorăm panoul de admin
  if (location.pathname.startsWith("/admin")) return;

  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const cacheBust = () => "?v=" + Date.now();

  // Helper pentru a extrage date nested (ex: "hero.title")
  function get(obj, path) {
    if (!obj || !path) return undefined;
    return path
      .split(".")
      .reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined),
        obj
      );
  }

  // Fetcher date
  async function fetchJSON(path) {
    try {
      const res = await fetch(path + cacheBust());
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn(`[CMS] Missing data: ${path}`);
      return {};
    }
  }

  // Identificare pagină
  function getPageKey() {
    if (document.body.dataset.page) return document.body.dataset.page;
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const map = {
      "/": "home",
      "/index.html": "home",
      "/about.html": "about",
      "/contact.html": "contact",
      "/store-charlton-kings.html": "store-charlton-kings",
      "/store-mx.html": "store-mx",
      "/store-site.html": "store-site",
    };
    return map[path] || null;
  }

  async function hydrate() {
    const pageKey = getPageKey();
    if (!pageKey) return;

    // Încărcăm Global Settings + Datele Paginii
    const [settings, page] = await Promise.all([
      fetchJSON("/content/settings/site.json"),
      fetchJSON(`/content/pages/${pageKey}.json`),
    ]);

    const data = { settings, ...page }; // Combinăm datele

    // 1. SEO
    if (page.seoTitle) document.title = page.seoTitle;
    else if (page.title && settings.siteTitle)
      document.title = `${page.title} | ${settings.siteTitle}`;

    // 2. TEXT (innerHTML permite bold/italic din markdown)
    qa("[data-cms]").forEach((el) => {
      const val = get(data, el.dataset.cms);
      if (val) el.innerHTML = val;
    });

    // 3. IMAGINI (src)
    qa("[data-cms-img]").forEach((el) => {
      const val = get(data, el.dataset.cmsImg);
      if (val) el.src = val;
    });

    // 4. LINK-URI (href) - ex: butonul de hartă sau social media
    qa("[data-cms-href]").forEach((el) => {
      const val = get(data, el.dataset.cmsHref);
      if (val) el.href = val;
    });

    // 5. IFRAME (src) - ex: Google Maps Embed
    qa("[data-cms-src]").forEach((el) => {
      const val = get(data, el.dataset.cmsSrc);
      if (val) el.src = val;
    });

    // 6. LISTE (REVIEWS / GALERII)
    qa("[data-cms-loop]").forEach((container) => {
      const listPath = container.dataset.cmsLoop;
      const listItems = get(data, listPath);

      if (!Array.isArray(listItems) || listItems.length === 0) return;

      // Template-ul este primul copil al containerului
      const template = container.firstElementChild;
      if (!template) return;

      const templateClone = template.cloneNode(true); // Păstrăm o copie curată
      container.innerHTML = ""; // Golim containerul

      listItems.forEach((item) => {
        const instance = templateClone.cloneNode(true);

        // Populăm instanța
        // a. Text
        Array.from(instance.querySelectorAll("[data-cms-item]")).forEach(
          (child) => {
            const key = child.dataset.cmsItem;
            if (item[key]) child.innerHTML = item[key];
          }
        );
        // b. Imagini
        Array.from(instance.querySelectorAll("[data-cms-item-img]")).forEach(
          (child) => {
            const key = child.dataset.cmsItemImg;
            if (item[key]) child.src = item[key];
          }
        );

        container.appendChild(instance);
      });
    });

    // Footer Links Globale (Social & Contact)
    if (settings.contactEmail) {
      const el = q("a[href^='mailto:']");
      if (el) el.href = `mailto:${settings.contactEmail}`;
    }
    if (settings.contactPhone) {
      const el = q("a[href^='tel:']");
      if (el) el.href = `tel:${settings.contactPhone}`;
    }
    if (settings.socialFb) {
      const el = q("a[aria-label*='Facebook']");
      if (el) el.href = settings.socialFb;
    }
    if (settings.socialInsta) {
      const el = q("a[aria-label*='Instagram']");
      if (el) el.href = settings.socialInsta;
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", hydrate);
  else hydrate();
})();

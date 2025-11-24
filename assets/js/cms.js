/* assets/js/cms.js */
(function () {
  // 1. Siguranță: Nu rulăm scriptul dacă suntem în panoul de admin
  if (location.pathname.startsWith("/admin")) return;

  // Utilitare pentru selectarea elementelor DOM (mai rapid decât document.querySelector mereu)
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Funcție anti-cache: asigură că vedem mereu ultima versiune a conținutului
  const cacheBust = () => "?cache=" + Date.now();

  // Funcție helper pentru a extrage valori din obiecte folosind string-uri (ex: "seo.title")
  function get(obj, path) {
    if (!obj || !path) return undefined;
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  // Funcție generică pentru a descărca fișierele JSON
  async function fetchJSON(path) {
    const res = await fetch(path + cacheBust(), { cache: "no-store" });
    if (!res.ok) throw new Error("Fetch " + res.status + ": " + path);
    return res.json();
  }

  // Harta paginilor: leagă URL-ul din browser de numele fișierului JSON
  const PAGE_MAP = {
    "/": "home",
    "/index.html": "home",
    "/about.html": "about",
    "/contact.html": "contact",
    "/stores.html": "stores",
    "/store-charlton-kings.html": "store-charlton-kings",
    "/store-mx.html": "store-mx",
    "/store-site.html": "store-site",
    "/moosh.html": "moosh",
  };

  function getPageKey() {
    const body = document.body;
    if (!body) return null;

    // Prioritate 1: data-page setat direct în HTML (ex: <body data-page="about">)
    if (body.dataset.page) return body.dataset.page;

    // Prioritate 2: deducem din URL
    const path = location.pathname.replace(/\/+$/, "") || "/";
    return PAGE_MAP[path] || null;
  }

  // Funcția principală care "hidratează" pagina cu date
  async function hydrate() {
    const pageKey = getPageKey();
    if (!pageKey) return; // Dacă nu știm ce pagină e, nu facem nimic

    // A. Încărcăm setările globale (ex: Titlul site-ului, culori)
    let settings = {};
    try {
      // MODIFICARE: Calea este acum simplificată (/content/...)
      settings = await fetchJSON("/content/settings/site.json");
    } catch (e) {
      console.warn(
        "[CMS] Settings JSON missing (poate nu ai creat încă folderul 'settings'?):",
        e.message
      );
    }

    // B. Încărcăm conținutul specific paginii curente
    let page = {};
    try {
      // MODIFICARE: Calea este acum simplificată (/content/...)
      page = await fetchJSON("/content/pages/" + pageKey + ".json");
    } catch (e) {
      console.warn("[CMS] Page JSON missing:", pageKey, e.message);
    }

    // --- APLICAREA DATELOR ÎN PAGINĂ ---

    // 1. Titlul documentului (Tab-ul browserului)
    if (page.seo && page.seo.title) {
      document.title = page.seo.title;
    } else if (page.title && settings.siteTitle) {
      document.title = page.title + " | " + settings.siteTitle;
    } else if (page.title) {
      document.title = page.title;
    } else if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }

    // 2. Elementele standard: Titlu, Subtitlu, Corp text
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
      bodyEl.innerHTML = page.body; // Folosim innerHTML pentru că markdown-ul poate conține tag-uri
    }

    // 3. Imaginea Hero (Principală)
    if (page.heroImage) {
      // Căutăm imaginea după un atribut specific sau clase comune
      const heroImg =
        q("[data-hero-image]") || q(".hero img") || q(".hero-image img");
      if (heroImg) {
        heroImg.src = page.heroImage;
      }
    }

    // 4. Legături de text generice (Data Bindings simple)
    // Ex: <span data-cms-text="settings.tagline"></span>
    qa("[data-cms-text]").forEach((el) => {
      const path = el.getAttribute("data-cms-text");
      const value = get({ settings, page }, path);
      if (value !== undefined) el.textContent = value;
    });

    // 5. Legături HTML generice (pentru text formatat)
    qa("[data-cms-html]").forEach((el) => {
      const path = el.getAttribute("data-cms-html");
      const value = get({ settings, page }, path);
      if (value !== undefined) el.innerHTML = value;
    });

    // 6. Legături de atribute (avansat)
    // Ex: <a data-cms-attr="href:page.ctaLink">Buton</a>
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

    // 7. Debugger mic (doar pe localhost) pentru a confirma că CMS-ul e conectat
    if (
      location.hostname === "localhost" ||
      location.search.includes("cmsDebug")
    ) {
      const badge = document.createElement("div");
      badge.textContent = "CMS Active: " + pageKey;
      Object.assign(badge.style, {
        position: "fixed",
        right: "12px",
        bottom: "12px",
        background: "#a0e75a",
        color: "#000",
        padding: "6px 10px",
        borderRadius: "8px",
        font: "12px system-ui",
        fontWeight: "bold",
        zIndex: 9999,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      });
      document.body.appendChild(badge);
    }
  }

  // Pornim hidratarea imediat ce DOM-ul e gata
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrate);
  } else {
    hydrate();
  }
})();

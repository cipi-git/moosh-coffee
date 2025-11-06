
(function () {
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const get=(o,p)=>p?.split(".").reduce((a,k)=> (a&&a[k]!==undefined)?a[k]:undefined, o);
  const bust=()=>`?cache=${Date.now()}`;
  const fetchJSON=async p=>{const r=await fetch(p+bust(),{cache:"no-store"}); if(!r.ok) throw new Error(`${r.status}@${p}`); return r.json();};
  const pick=(sels)=>{for(const s of sels){const el=document.querySelector(s); if(el) return el;} return null;};
  const text=(el,v)=>{ if(el && v!==undefined && v!==null) el.textContent=v; };
  const html=(el,v)=>{ if(el && v!==undefined && v!==null) el.innerHTML=v; };
  const show=(el)=>{ if(el) el.style.display=""; };

  async function main(){
    let settings={}; try{ settings=await fetchJSON("/src/content/settings/site.json"); }catch(e){ console.warn("[CMS] no settings", e.message); }
    if(settings.siteTitle) document.title=settings.siteTitle;
    if(settings.primaryColor) document.documentElement.style.setProperty("--primary", settings.primaryColor);
    qa("[data-cms-logo]").forEach(img=>{ if(settings.logo){ img.src=settings.logo; img.alt=settings.siteTitle||"Logo"; }});
    qa("[data-brand]").forEach(el=>{ if(settings.siteTitle) el.textContent=settings.siteTitle; });
    qa("[data-cms='footer.text']").forEach(el=>{ const v=get(settings,"footer.text"); if(v!==undefined) el.textContent=v; });
    const sm=q("[data-cms-mount='footer.social']");
    if(sm && Array.isArray(get(settings,"footer.social"))){ sm.innerHTML=""; get(settings,"footer.social").forEach(s=>{ const a=document.createElement("a"); a.textContent=s.label; a.href=s.href; a.target="_blank"; a.rel="noopener"; a.style.marginRight="12px"; sm.appendChild(a); }); }

    const pageKey=(document.body.getAttribute("data-page")||"").trim().toLowerCase();
    if(!pageKey) return;
    let page={}; try{ page=await fetchJSON(`/src/content/pages/${pageKey}.json`); }catch(e){ console.error("[CMS] missing page json", pageKey, e.message); return; }
    if(get(page,"seo.title")) document.title=get(page,"seo.title");

    const heroTitle   = get(page,"hero.title")    ?? page.title;
    const heroSubtitle= get(page,"hero.subtitle") ?? page.subtitle ?? "";
    const heroImage   = get(page,"hero.image")    ?? page.heroImage ?? "";
    const heroBg      = get(page,"hero.bg")       ?? "";

    const heroTitleEl    = q("#hero-title")    || pick([".hero h1","header h1","h1"]);
    const heroSubtitleEl = q("#hero-subtitle") || pick([".hero p","header p","h1 + p","p"]);
    const heroImgEl      = q("#hero-img")      || pick([".hero img","header img","main img","img"]);
    const heroSection    = q(".hero")          || pick(["header","section"]);

    if(heroTitleEl && heroTitle) text(heroTitleEl, heroTitle);
    if(heroSubtitleEl) text(heroSubtitleEl, heroSubtitle || "");
    if(heroImgEl && heroImage){ heroImgEl.src=heroImage; show(heroImgEl); }
    if(heroSection && heroBg){ heroSection.style.backgroundImage=`url("${heroBg}")`; heroSection.style.backgroundSize="cover"; heroSection.style.backgroundPosition="center"; }

    const pageTitleEl    = q("#page-title")    || pick(["main h2","h2"]);
    const pageSubtitleEl = q("#page-subtitle") || pick(["main h2 + p","h2 + p"]);
    if(pageTitleEl)    text(pageTitleEl, page.title ?? settings?.siteTitle ?? pageTitleEl.textContent);
    if(pageSubtitleEl) text(pageSubtitleEl, page.subtitle ?? pageSubtitleEl.textContent);

    let pageBodyEl = q("#page-body");
    if(!pageBodyEl){
      pageBodyEl = document.createElement("div");
      pageBodyEl.id = "page-body";
      pageBodyEl.style.display = "contents";
      (document.querySelector("main") || document.body).appendChild(pageBodyEl);
    }
    if(page.body){ html(pageBodyEl, page.body); }

    qa("[data-cms]").forEach(el=>{ const k=el.getAttribute("data-cms"); const v=get(page,k) ?? get(settings,k); if(v!==undefined) el.textContent=v; });
    qa("[data-cms-html]").forEach(el=>{ const k=el.getAttribute("data-cms-html"); const v=get(page,k) ?? get(settings,k); if(v!==undefined) el.innerHTML=v; });
    qa("[data-cms-img]").forEach(el=>{ const k=el.getAttribute("data-cms-img"); const v=get(page,k) ?? get(settings,k); if(v){ el.src=v; show(el);} });
    qa("[data-cms-href]").forEach(el=>{ const k=el.getAttribute("data-cms-href"); const v=get(page,k) ?? get(settings,k); if(v) el.href=v; });
    qa("[data-cms-bg]").forEach(el=>{ const k=el.getAttribute("data-cms-bg"); const v=get(page,k) ?? get(settings,k); if(v) el.style.backgroundImage=`url("${v}")`; });

    const badge=document.createElement("div");
    badge.textContent="CMS Connected ✅";
    Object.assign(badge.style,{position:"fixed",right:"12px",bottom:"12px",background:"#a0e75a",color:"#000",padding:"6px 10px",borderRadius:"8px",font:"12px system-ui",zIndex:9999});
    document.body.appendChild(badge);
  }
  main().catch(e=>console.error("[CMS] Fatal:", e));
})();

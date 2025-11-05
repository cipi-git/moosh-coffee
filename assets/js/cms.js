
(function () {
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const get=(o,p)=>p?.split(".").reduce((a,k)=> (a&&a[k]!==undefined)?a[k]:undefined, o);
  const bust=()=>`?cache=${Date.now()}`;
  const fetchJSON=async p=>{const r=await fetch(p+bust(),{cache:"no-store"}); if(!r.ok) throw new Error(`${r.status}@${p}`); return r.json();};

  function text(el, v){ if(el && v!==undefined && v!==null) el.textContent=v; }
  function html(el, v){ if(el && v!==undefined && v!==null) el.innerHTML=v; }
  function show(el){ if(el) el.style.display=""; }

  async function main(){
    let settings={}; try{ settings=await fetchJSON("/src/content/settings/site.json"); }catch(e){ console.warn("[CMS] no settings", e.message); }
    if(settings.siteTitle) document.title=settings.siteTitle;
    if(settings.primaryColor) document.documentElement.style.setProperty("--primary", settings.primaryColor);
    qa("[data-cms-logo]").forEach(img=>{ if(settings.logo){ img.src=settings.logo; img.alt=settings.siteTitle||"Logo"; }});
    qa("[data-brand]").forEach(el=>{ if(settings.siteTitle) el.textContent=settings.siteTitle; });
    qa("[data-cms='footer.text']").forEach(el=>{ const v=get(settings,"footer.text"); if(v!==undefined) el.textContent=v; });
    const mount=q("[data-cms-mount='footer.social']");
    if(mount && Array.isArray(get(settings,"footer.social"))){ mount.innerHTML=""; get(settings,"footer.social").forEach(s=>{ const a=document.createElement("a"); a.textContent=s.label; a.href=s.href; a.target="_blank"; a.rel="noopener"; a.style.marginRight="12px"; mount.appendChild(a); }); }

    const pageKey=(document.body.getAttribute("data-page")||"").trim().toLowerCase();
    if(!pageKey) return;
    let page={}; try{ page=await fetchJSON(`/src/content/pages/${pageKey}.json`); }catch(e){ console.error("[CMS] missing page json", pageKey, e.message); return; }
    if(get(page,"seo.title")) document.title=get(page,"seo.title");

    const heroTitle   = get(page,"hero.title")    ?? page.title;
    const heroSubtitle= get(page,"hero.subtitle") ?? page.subtitle ?? "";
    const heroImage   = get(page,"hero.image")    ?? page.heroImage ?? "";
    const heroBg      = get(page,"hero.bg")       ?? "";

    if(q("#hero-title")) text(q("#hero-title"), heroTitle);
    if(q("#hero-subtitle")) text(q("#hero-subtitle"), heroSubtitle);
    if(q("#hero-img") && heroImage){ q("#hero-img").src=heroImage; show(q("#hero-img")); }
    if(q(".hero") && heroBg){ const sec=q(".hero"); sec.style.backgroundImage=`url("${heroBg}")`; sec.style.backgroundSize="cover"; sec.style.backgroundPosition="center"; }

    if(q("#page-title")) text(q("#page-title"), page.title ?? settings.siteTitle ?? "");
    if(q("#page-subtitle")) text(q("#page-subtitle"), page.subtitle ?? "");
    if(q("#page-body")) html(q("#page-body"), page.body ?? q("#page-body").innerHTML);

    qa("[data-cms]").forEach(el=>{ const k=el.getAttribute("data-cms"); const v=get(page,k) ?? get(settings,k); if(v!==undefined) el.textContent=v; });
    qa("[data-cms-html]").forEach(el=>{ const k=el.getAttribute("data-cms-html"); const v=get(page,k) ?? get(settings,k); if(v!==undefined) el.innerHTML=v; });
    qa("[data-cms-img]").forEach(el=>{ const k=el.getAttribute("data-cms-img"); const v=get(page,k) ?? get(settings,k); if(v){ el.src=v; show(el);} });
    qa("[data-cms-href]").forEach(el=>{ const k=el.getAttribute("data-cms-href"); const v=get(page,k) ?? get(settings,k); if(v) el.href=v; });
    qa("[data-cms-bg]").forEach(el=>{ const k=el.getAttribute("data-cms-bg"); const v=get(page,k) ?? get(settings,k); if(v) el.style.backgroundImage=`url("${v}")`; });

    const badge=document.createElement("div"); badge.textContent="CMS Connected ✅";
    Object.assign(badge.style,{position:"fixed",right:"12px",bottom:"12px",background:"#a0e75a",color:"#000",padding:"6px 10px",borderRadius:"8px",font:"12px system-ui",zIndex:9999});
    document.body.appendChild(badge);
  }
  main().catch(e=>console.error("[CMS] Fatal:", e));
})();

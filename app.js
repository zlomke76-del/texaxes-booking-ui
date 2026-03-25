const partialMap = {
  "site-header": "/partials/header.html",
  "hero-section": "/partials/hero.html",
  "authority-section": "/partials/authority.html",
  "league-callout-section": "/partials/league-callout.html",
  "play-section": "/partials/play.html",
  "story-section": "/partials/story.html",
  "experience-section": "/partials/experience.html",
  "pricing-section": "/partials/pricing.html",
  "gallery-section": "/partials/gallery.html",
  "waivers-section": "/partials/waivers.html",
  "faqs-section": "/partials/faqs.html",
  "cta-section": "/partials/cta.html",
  "site-footer": "/partials/footer.html"
};

async function loadPartial(targetId, path) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    target.innerHTML = `<div class="container" style="padding:40px 0;color:#ffb4b4;">Failed to load section: ${path}</div>`;
    return;
  }

  target.innerHTML = await response.text();
}

async function boot() {
  await Promise.all(
    Object.entries(partialMap).map(([targetId, path]) => loadPartial(targetId, path))
  );

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

boot();

import { ensureLeagueData, initLeagueCallout } from "./js/league.js";
import { initBooking } from "./js/booking.js";

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

  try {
    const response = await fetch(path, { cache: "no-store" });

    if (!response.ok) {
      target.innerHTML = `<div class="container" style="padding:40px 0;color:#ffb4b4;">Failed to load section: ${path}</div>`;
      return;
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error(`Failed to load partial: ${path}`, error);
    target.innerHTML = `<div class="container" style="padding:40px 0;color:#ffb4b4;">Failed to load section: ${path}</div>`;
  }
}

function initMobileMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");

  if (!toggle || !menu) return;

  const setOpen = (isOpen) => {
    menu.hidden = !isOpen;
    menu.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  setOpen(false);

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 840) {
      setOpen(false);
    }
  });
}

async function initPageFeatures() {
  const hasLeagueSection =
    document.getElementById("league-callout-section") ||
    document.querySelector(".league-section") ||
    document.querySelector(".league-callout");

  if (hasLeagueSection) {
    await ensureLeagueData();
    initLeagueCallout();
  }

  const hasBookingSection =
    document.getElementById("hero-section") ||
    document.querySelector("[data-booking-root]") ||
    document.querySelector(".booking-grid");

  if (hasBookingSection) {
    initBooking();
  }
}

function initYear() {
  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

async function boot() {
  await Promise.all(
    Object.entries(partialMap).map(([targetId, path]) => loadPartial(targetId, path))
  );

  initMobileMenu();
  await initPageFeatures();
  initYear();
}

boot();

let leagueDataPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.loaded = "false";
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export function ensureLeagueData() {
  if (!leagueDataPromise) {
    leagueDataPromise = loadScript("/assets/data/league-dates.js");
  }
  return leagueDataPromise;
}

export function initLeagueCallout() {
  const root = document.querySelector("#league-callout-section .league-section");
  if (!root) return;

  const data = window.TEX_AXES_LEAGUE_DATES;
  if (!data || !Array.isArray(data.seasons) || !data.seasons.length) return;

  const TIMEZONE = data.timezone || "America/Chicago";
  const SEASON_LENGTH_WEEKS = data.seasonLengthWeeks || 8;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();

  function parseDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function formatLongDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function formatNow(date) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(date);
  }

  function daysUntil(target) {
    return Math.max(0, Math.ceil((target - now) / DAY_MS));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  const seasons = data.seasons.map((season) => {
    const start = parseDate(season.startSunday);
    const end = addDays(start, (SEASON_LENGTH_WEEKS - 1) * 7 + 4);
    return {
      ...season,
      start,
      end,
      firstTuesday: addDays(start, 2),
      firstThursday: addDays(start, 4),
      tournamentSunday: addDays(start, (SEASON_LENGTH_WEEKS - 1) * 7)
    };
  });

  function getContext() {
    for (let i = 0; i < seasons.length; i += 1) {
      const season = seasons[i];

      if (now < season.start) {
        return { state: "preseason", season };
      }

      if (now >= season.start && now <= season.end) {
        return { state: "active", season };
      }

      const nextSeason = seasons[i + 1];
      if (nextSeason && now > season.end && now < nextSeason.start) {
        return { state: "between", season: nextSeason, previous: season };
      }
    }

    return { state: "postseason", season: seasons[seasons.length - 1] };
  }

  function getWeekNumber(start) {
    const diffDays = Math.floor((now - start) / DAY_MS);
    return Math.max(
      1,
      Math.min(SEASON_LENGTH_WEEKS, Math.floor(diffDays / 7) + 1)
    );
  }

  function buildSegments(activeWeek, state) {
    const segments = [];
    for (let i = 1; i <= SEASON_LENGTH_WEEKS; i += 1) {
      let cls = "league-timeline-segment";
      if (state === "active") {
        if (i < activeWeek) cls += " is-complete";
        if (i === activeWeek) cls += " is-current";
        if (i === SEASON_LENGTH_WEEKS) cls += " is-tournament";
      } else if (state === "preseason") {
        if (i === SEASON_LENGTH_WEEKS) cls += " is-tournament";
      } else if (state === "between" || state === "postseason") {
        cls += " is-complete";
        if (i === SEASON_LENGTH_WEEKS) cls += " is-tournament";
      }
      segments.push(`<div class="${cls}" aria-label="Week ${i}"></div>`);
    }
    return segments.join("");
  }

  function getProgressPercent(state, activeWeek) {
    if (state === "preseason") return 0;
    if (state === "between" || state === "postseason") return 100;
    return ((activeWeek - 1) / (SEASON_LENGTH_WEEKS - 1)) * 100;
  }

  function renderLaneList(lanes, seasonStart) {
    if (!Array.isArray(lanes) || !lanes.length) return "";
    const items = lanes.map((lane) => {
      const laneDate = addDays(seasonStart, lane.dayOffset);
      return `<div>${lane.label} · ${formatShortDate(laneDate)} · ${lane.time}</div>`;
    });

    return `
      <div class="league-inline-note">
        <strong>Season starts:</strong>
        ${items.join("")}
      </div>
    `;
  }

  function renderDisciplineCards(seasonStart) {
    const lanes = data.disciplineLanes || {};
    setHTML("hatchet-next", renderLaneList(lanes.hatchet, seasonStart));
    setHTML("hatchet-duals-next", renderLaneList(lanes.hatchetDuals, seasonStart));
    setHTML("knife-next", renderLaneList(lanes.knife, seasonStart));
    setHTML("knife-duals-next", renderLaneList(lanes.knifeDuals, seasonStart));
    setHTML("bigaxe-next", renderLaneList(lanes.bigaxe, seasonStart));
  }

  const context = getContext();
  const currentSeason = context.season;
  const activeWeek = currentSeason ? getWeekNumber(currentSeason.start) : 1;

  setText("league-now", "Current Houston time: " + formatNow(now));

  const segmentsEl = document.getElementById("league-timeline-segments");
  const progressEl = document.getElementById("league-timeline-progress");
  const glowEl = document.getElementById("league-timeline-glow");
  const liveBadgeEl = document.getElementById("league-live-badge");

  if (segmentsEl) {
    segmentsEl.innerHTML = buildSegments(
      context.state === "active" ? activeWeek : SEASON_LENGTH_WEEKS,
      context.state
    );
  }

  const progressPercent = getProgressPercent(context.state, activeWeek);
  if (progressEl) progressEl.style.width = progressPercent + "%";

  if (glowEl) {
    requestAnimationFrame(() => {
      glowEl.classList.add("is-visible");
      glowEl.style.transform = `translateX(calc(${progressPercent}% - 18px))`;
    });
  }

  if (context.state === "preseason") {
    const season = context.season;
    const countdown = daysUntil(season.start);

    setText("league-status", `${season.label} starts in ${countdown} day${countdown === 1 ? "" : "s"}`);
    setText(
      "league-next",
      `Opening Sunday: ${formatLongDate(season.start)} · Tuesday follows ${formatShortDate(season.firstTuesday)} · Thursday follows ${formatShortDate(season.firstThursday)}`
    );
    setText("timeline-phase-label", `${season.label} incoming`);
    setText("timeline-phase-sub", "League is about to start");
    setText("league-note-pill", `${season.label} registration window`);
    setText(
      "league-season-copy",
      "Season play has not started yet. Opening Sunday anchors the full 8-week schedule."
    );
    setText("league-meta-season", season.label);
    setText("league-meta-week", "Starts " + formatShortDate(season.start));
    setText("league-meta-state", "Pre-season");
    setText("league-summary-title-1", `${season.label} opening`);
    setText("league-summary-copy-1", `Opening Sunday is ${formatLongDate(season.start)}.`);
    setText("league-summary-title-2", "Full weekly rhythm");
    setText("league-summary-copy-2", "Tuesday and Thursday automatically follow the Sunday opener.");
    if (liveBadgeEl) liveBadgeEl.textContent = "League About To Start";

    renderDisciplineCards(season.start);
  }

  if (context.state === "active") {
    const season = context.season;
    const weekStartSunday = addDays(season.start, (activeWeek - 1) * 7);
    const weekTuesday = addDays(weekStartSunday, 2);
    const weekThursday = addDays(weekStartSunday, 4);

    setText("league-status", `${season.label} · Currently in Week ${activeWeek} of ${SEASON_LENGTH_WEEKS}`);
    setText(
      "league-next",
      `This week: Sunday ${formatShortDate(weekStartSunday)} · Tuesday ${formatShortDate(weekTuesday)} · Thursday ${formatShortDate(weekThursday)}`
    );
    setText("timeline-phase-label", `Week ${activeWeek} active`);
    setText(
      "timeline-phase-sub",
      activeWeek === SEASON_LENGTH_WEEKS ? "Tournament week is live" : "Regular season in progress"
    );
    setText("league-note-pill", `${season.label} active`);
    setText(
      "league-season-copy",
      "Includes 1 hour of warmup and practice each week alongside league play."
    );
    setText("league-meta-season", season.label);
    setText("league-meta-week", `Week ${activeWeek} of ${SEASON_LENGTH_WEEKS}`);
    setText("league-meta-state", activeWeek === SEASON_LENGTH_WEEKS ? "Tournament week" : "In season");
    setText("league-summary-title-1", "Current season");
    setText("league-summary-copy-1", `${season.label} is currently in progress.`);
    setText("league-summary-title-2", "Tournament target");
    setText("league-summary-copy-2", `Week 8 tournament Sunday lands on ${formatLongDate(season.tournamentSunday)}.`);
    if (liveBadgeEl) {
      liveBadgeEl.textContent = activeWeek === SEASON_LENGTH_WEEKS ? "Tournament Week" : "Live League Season";
    }

    renderDisciplineCards(season.start);
  }

  if (context.state === "between") {
    const season = context.season;
    const countdown = daysUntil(season.start);

    setText(
      "league-status",
      `${context.previous.label} complete · ${season.label} starts in ${countdown} day${countdown === 1 ? "" : "s"}`
    );
    setText(
      "league-next",
      `${season.label} opens Sunday ${formatLongDate(season.start)} · Tuesday follows ${formatShortDate(season.firstTuesday)} · Thursday follows ${formatShortDate(season.firstThursday)}`
    );
    setText("timeline-phase-label", `${context.previous.label} complete`);
    setText("timeline-phase-sub", `${season.label} is the next season`);
    setText("league-note-pill", `${season.label} coming next`);
    setText(
      "league-season-copy",
      "The last season has wrapped. The next Sunday opener is already set."
    );
    setText("league-meta-season", season.label);
    setText("league-meta-week", "Starts " + formatShortDate(season.start));
    setText("league-meta-state", "Between seasons");
    setText("league-summary-title-1", "Last season complete");
    setText("league-summary-copy-1", `${context.previous.label} has finished.`);
    setText("league-summary-title-2", "Next season queued");
    setText("league-summary-copy-2", `${season.label} opens on ${formatLongDate(season.start)}.`);
    if (liveBadgeEl) liveBadgeEl.textContent = "Next Season Scheduled";

    renderDisciplineCards(season.start);
  }

  if (context.state === "postseason") {
    const season = context.season;

    setText("league-status", `${season.label} complete`);
    setText(
      "league-next",
      "This season finished on tournament week. New season dates can be posted as soon as they are set."
    );
    setText("timeline-phase-label", `${season.label} complete`);
    setText("timeline-phase-sub", "Tournament finished");
    setText("league-note-pill", "Season complete");
    setText(
      "league-season-copy",
      "The latest posted season has finished. Add the next Sunday anchor date to publish the next season."
    );
    setText("league-meta-season", season.label);
    setText("league-meta-week", "Finalized");
    setText("league-meta-state", "Awaiting next season");
    setText("league-summary-title-1", "Season complete");
    setText("league-summary-copy-1", `${season.label} has finished.`);
    setText("league-summary-title-2", "Ready for update");
    setText("league-summary-copy-2", "Post the next Sunday opener to activate the next season.");
    if (liveBadgeEl) liveBadgeEl.textContent = "Season Complete";

    setHTML("hatchet-next", `<div class="league-inline-note">Next season date pending</div>`);
    setHTML("hatchet-duals-next", `<div class="league-inline-note">Next season date pending</div>`);
    setHTML("knife-next", `<div class="league-inline-note">Next season date pending</div>`);
    setHTML("knife-duals-next", `<div class="league-inline-note">Next season date pending</div>`);
    setHTML("bigaxe-next", `<div class="league-inline-note">Next season date pending</div>`);
  }

  setText(
    "marathon-callout-copy",
    "Saturday marathon dates are posted once finalized for each season and discipline."
  );
  setText("marathon-callout-badge", "Seasonal format");
}

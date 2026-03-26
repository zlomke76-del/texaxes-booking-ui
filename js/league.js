let leagueDataPromise = null;

const leagueBookingState = {
  modal: null,
  isOpen: false,
  isSubmitting: false,
  step: 1,
  seasonOptions: [],
  selectedContext: null,
  values: {
    discipline: "hatchet",
    seasonLabel: "",
    seasonStartSunday: "",
    laneLabel: "",
    laneDate: "",
    laneTime: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    notes: "",
    experience_level: "new",
    marketing_opt_in: false
  }
};

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function parseLeagueDate(dateString) {
  const [year, month, day] = String(dateString).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function addLeagueDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatLeagueShortDate(date, timeZone = "America/Chicago") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatLeagueLongDate(date, timeZone = "America/Chicago") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function ensureLeagueBookingStyles() {
  if (document.getElementById("texaxes-league-booking-styles")) return;

  const style = document.createElement("style");
  style.id = "texaxes-league-booking-styles";
  style.textContent = `
    .tx-league-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 28px;
      background: rgba(4, 8, 18, 0.8);
      backdrop-filter: blur(14px);
    }

    .tx-league-overlay.is-open {
      display: flex;
    }

    .tx-league-modal {
      width: min(1220px, 100%);
      max-height: calc(100vh - 40px);
      overflow: auto;
      border-radius: 32px;
      color: #f5f7fb;
      background:
        radial-gradient(circle at top left, rgba(92,125,255,0.18), transparent 30%),
        radial-gradient(circle at bottom right, rgba(255,122,89,0.2), transparent 28%),
        linear-gradient(180deg, rgba(12,18,36,0.98), rgba(8,12,24,0.98));
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: 0 40px 120px rgba(0,0,0,0.6);
    }

    .tx-league-shell {
      padding: 34px;
    }

    .tx-league-top {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
    }

    .tx-league-title {
      margin: 0;
      font-size: clamp(2rem, 3.4vw, 3rem);
      line-height: 1;
      letter-spacing: -0.04em;
      color: #fff;
    }

    .tx-league-subtitle {
      margin: 10px 0 0;
      color: rgba(255,255,255,0.78);
      max-width: 66ch;
      line-height: 1.58;
      font-size: 1rem;
    }

    .tx-league-close {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(255,255,255,0.06);
      color: #fff;
      border-radius: 999px;
      width: 46px;
      height: 46px;
      font-size: 1.15rem;
      cursor: pointer;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
      flex-shrink: 0;
    }

    .tx-league-close:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,122,89,0.34);
    }

    .tx-league-layout {
      display: grid;
      grid-template-columns: 1.6fr 0.85fr;
      gap: 26px;
    }

    .tx-league-main,
    .tx-league-side {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      border-radius: 26px;
      padding: 26px;
    }

    .tx-league-side {
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    }

    .tx-league-steps {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 26px;
    }

    .tx-league-step-pill {
      border-radius: 16px;
      padding: 11px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      min-height: 68px;
      transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    }

    .tx-league-step-pill.is-active {
      background: linear-gradient(135deg, rgba(255,122,89,0.18), rgba(255,122,89,0.08));
      border-color: rgba(255,122,89,0.56);
      box-shadow: inset 0 0 0 1px rgba(255,122,89,0.16), 0 12px 24px rgba(255,122,89,0.08);
      transform: translateY(-1px);
    }

    .tx-league-step-number {
      font-size: 0.74rem;
      color: rgba(255,255,255,0.56);
      margin-bottom: 7px;
    }

    .tx-league-step-label {
      font-size: 0.94rem;
      line-height: 1.28;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-league-step-head {
      margin-bottom: 18px;
    }

    .tx-league-step-title {
      margin: 0 0 8px;
      font-size: 1.28rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .tx-league-step-copy {
      margin: 0;
      color: rgba(255,255,255,0.76);
      line-height: 1.55;
      font-size: 0.98rem;
    }

    .tx-league-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .tx-league-choice,
    .tx-league-slot {
      appearance: none;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      border-radius: 22px;
      padding: 20px;
      cursor: pointer;
      text-align: left;
      color: #ffffff;
      transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }

    .tx-league-choice:hover,
    .tx-league-slot:hover {
      transform: translateY(-2px) scale(1.01);
      border-color: rgba(255,122,89,0.34);
      background: rgba(255,255,255,0.07);
      box-shadow: 0 16px 34px rgba(0,0,0,0.2);
    }

    .tx-league-choice.is-selected,
    .tx-league-slot.is-selected {
      border-color: rgba(255,122,89,0.7);
      background: linear-gradient(135deg, rgba(255,122,89,0.18), rgba(255,122,89,0.08));
      box-shadow: inset 0 0 0 1px rgba(255,122,89,0.2), 0 24px 50px rgba(255,122,89,0.18);
      transform: scale(1.025);
    }

    .tx-league-choice-title {
      font-size: 1.14rem;
      font-weight: 900;
      margin: 0 0 8px;
      color: #fff;
      letter-spacing: -0.03em;
    }

    .tx-league-choice-meta {
      color: #ffd1bd;
      font-weight: 800;
      font-size: 0.92rem;
      margin-bottom: 8px;
    }

    .tx-league-choice-copy {
      color: rgba(255,255,255,0.82);
      font-size: 0.95rem;
      line-height: 1.52;
      margin: 0;
    }

    .tx-league-slot-title {
      font-size: 1.02rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }

    .tx-league-slot-copy {
      color: rgba(255,255,255,0.8);
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .tx-league-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
      min-width: 0;
    }

    .tx-league-label {
      font-size: 0.9rem;
      font-weight: 800;
      color: #ffffff;
    }

    .tx-league-input,
    .tx-league-select,
    .tx-league-textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8,12,22,0.84);
      color: #ffffff;
      border-radius: 15px;
      padding: 13px 14px;
      font: inherit;
      box-sizing: border-box;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .tx-league-input:focus,
    .tx-league-select:focus,
    .tx-league-textarea:focus {
      outline: none;
      border-color: rgba(255,122,89,0.52);
      box-shadow: 0 0 0 3px rgba(255,122,89,0.12);
      background: rgba(10,14,26,0.92);
    }

    .tx-league-textarea {
      min-height: 124px;
      resize: vertical;
      background: linear-gradient(180deg, rgba(10,14,26,0.9), rgba(8,12,22,0.9));
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.25);
    }

    .tx-league-inline-note,
    .tx-league-error,
    .tx-league-muted {
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .tx-league-inline-note,
    .tx-league-muted {
      color: rgba(255,255,255,0.72);
    }

    .tx-league-error {
      color: #ffb7ae;
      margin-top: 12px;
    }

    .tx-league-field-error {
      border-color: rgba(255, 122, 89, 0.52);
      box-shadow: 0 0 0 1px rgba(255, 122, 89, 0.18);
    }

    .tx-league-side-block + .tx-league-side-block {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .tx-league-side-title {
      margin: 0 0 12px;
      font-size: 1.04rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-league-kv {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 0;
      color: rgba(255,255,255,0.82);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .tx-league-kv strong {
      color: #ffffff;
      text-align: right;
      font-size: 1rem;
      font-weight: 900;
    }

    .tx-league-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 24px;
    }

    .tx-league-btn-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tx-league-btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: #ffffff;
      border-radius: 15px;
      padding: 13px 18px;
      font-weight: 800;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
    }

    .tx-league-btn:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.08);
    }

    .tx-league-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .tx-league-btn-primary {
      background: linear-gradient(135deg, rgba(255,122,89,0.98), rgba(234,94,73,0.96));
      border-color: rgba(255,122,89,0.42);
      box-shadow: 0 18px 40px rgba(255,122,89,0.28);
      padding: 14px 22px;
      font-size: 1rem;
      border-radius: 16px;
    }

    .tx-league-btn-primary:hover {
      background: linear-gradient(135deg, rgba(255,132,99,1), rgba(240,102,81,0.98));
      transform: translateY(-2px) scale(1.02);
    }

    .tx-league-checkbox {
      display: flex;
      align-items: start;
      gap: 10px;
      color: rgba(255,255,255,0.82);
      line-height: 1.48;
      font-size: 0.93rem;
    }

    @media (max-width: 960px) {
      .tx-league-layout {
        grid-template-columns: 1fr;
      }

      .tx-league-steps {
        grid-template-columns: repeat(2, 1fr);
      }

      .tx-league-grid-2,
      .tx-league-actions {
        grid-template-columns: 1fr;
      }

      .tx-league-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .tx-league-btn-row {
        justify-content: flex-end;
      }
    }
  `;
  document.head.appendChild(style);
}

function getLeagueDisciplineOptions() {
  return [
    {
      key: "hatchet",
      title: "Hatchet League",
      meta: "Standard weekly league play",
      copy: "The core competitive track for throwers building consistency, scores, and season rhythm."
    },
    {
      key: "hatchetDuals",
      title: "Hatchet Duals",
      meta: "Partnered league format",
      copy: "A shared rhythm for paired competition, strategy, and team-based weekly play."
    },
    {
      key: "knife",
      title: "Knife League",
      meta: "WKTL throwing format",
      copy: "For players who want a dedicated knife throwing season with consistent weekly competition."
    },
    {
      key: "knifeDuals",
      title: "Knife Duals",
      meta: "Partner knife format",
      copy: "A paired WKTL track for throwers who want the duals experience from week one."
    },
    {
      key: "bigaxe",
      title: "Big Axe League",
      meta: "Heavier competitive format",
      copy: "A more demanding discipline for throwers looking for the full big axe season environment."
    }
  ];
}

function getLeagueStepTitles() {
  return ["Discipline", "Season", "Player", "Review"];
}

function getLeagueNextStepLabel() {
  if (leagueBookingState.step === 1) return "Choose Season";
  if (leagueBookingState.step === 2) return "Continue to Player Details";
  if (leagueBookingState.step === 3) return "Review Registration";
  return "Continue";
}

function leagueStepIsValid(step) {
  const v = leagueBookingState.values;

  if (step === 1) {
    return Boolean(v.discipline);
  }

  if (step === 2) {
    return Boolean(v.seasonLabel && v.laneLabel && v.laneDate && v.laneTime);
  }

  if (step === 3) {
    return (
      v.first_name.trim().length > 0 &&
      v.last_name.trim().length > 0 &&
      isValidEmail(v.email)
    );
  }

  if (step === 4) {
    return leagueStepIsValid(1) && leagueStepIsValid(2) && leagueStepIsValid(3);
  }

  return false;
}

function createLeagueBookingModal() {
  if (leagueBookingState.modal) return leagueBookingState.modal;

  ensureLeagueBookingStyles();

  const overlay = document.createElement("div");
  overlay.className = "tx-league-overlay";
  overlay.innerHTML = `
    <div class="tx-league-modal" role="dialog" aria-modal="true" aria-labelledby="tx-league-title">
      <div class="tx-league-shell">
        <div class="tx-league-top">
          <div>
            <h2 class="tx-league-title" id="tx-league-title">Join League Play</h2>
            <p class="tx-league-subtitle">
              Choose your discipline, lock in the season lane that fits, and send your registration details in one guided flow.
            </p>
          </div>
          <button class="tx-league-close" type="button" aria-label="Close league registration flow">✕</button>
        </div>

        <div class="tx-league-layout">
          <div class="tx-league-main" id="tx-league-main"></div>
          <aside class="tx-league-side" id="tx-league-side"></aside>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeLeagueBookingModal();
    }
  });

  const closeBtn = overlay.querySelector(".tx-league-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeLeagueBookingModal);
  }

  leagueBookingState.modal = overlay;
  return overlay;
}

function closeLeagueBookingModal() {
  if (!leagueBookingState.modal) return;
  leagueBookingState.isOpen = false;
  leagueBookingState.modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

function setLeagueStep(step) {
  leagueBookingState.step = Math.max(1, Math.min(4, step));
  renderLeagueBookingFlow();
}

function buildLeagueSeasonOptions() {
  const data = window.TEX_AXES_LEAGUE_DATES;
  if (!data || !Array.isArray(data.seasons)) return [];

  const timeZone = data.timezone || "America/Chicago";
  const disciplineLanes = data.disciplineLanes || {};
  const selectedDiscipline = leagueBookingState.values.discipline;
  const lanes = Array.isArray(disciplineLanes[selectedDiscipline])
    ? disciplineLanes[selectedDiscipline]
    : [];

  return data.seasons.flatMap((season) => {
    const seasonStart = parseLeagueDate(season.startSunday);

    return lanes.map((lane, index) => {
      const laneDate = addLeagueDays(seasonStart, lane.dayOffset || 0);
      return {
        id: `${season.label}-${selectedDiscipline}-${index}`,
        seasonLabel: season.label,
        seasonStartSunday: season.startSunday,
        laneLabel: lane.label,
        laneDate: laneDate.toISOString().slice(0, 10),
        laneDateDisplay: formatLeagueLongDate(laneDate, timeZone),
        laneTime: lane.time,
        summary: `${lane.label} · ${formatLeagueShortDate(laneDate, timeZone)} · ${lane.time}`
      };
    });
  });
}

function syncLeagueSeasonOptions() {
  leagueBookingState.seasonOptions = buildLeagueSeasonOptions();

  const hasSelected = leagueBookingState.seasonOptions.some(
    (option) =>
      option.seasonLabel === leagueBookingState.values.seasonLabel &&
      option.laneLabel === leagueBookingState.values.laneLabel &&
      option.laneTime === leagueBookingState.values.laneTime
  );

  if (!hasSelected && leagueBookingState.seasonOptions.length) {
    const first = leagueBookingState.seasonOptions[0];
    leagueBookingState.values.seasonLabel = first.seasonLabel;
    leagueBookingState.values.seasonStartSunday = first.seasonStartSunday;
    leagueBookingState.values.laneLabel = first.laneLabel;
    leagueBookingState.values.laneDate = first.laneDate;
    leagueBookingState.values.laneTime = first.laneTime;
  }
}

function openLeagueBookingModal(prefillDiscipline = "") {
  createLeagueBookingModal();

  if (prefillDiscipline) {
    leagueBookingState.values.discipline = prefillDiscipline;
  }

  syncLeagueSeasonOptions();

  leagueBookingState.isOpen = true;
  leagueBookingState.step = 1;
  leagueBookingState.modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  renderLeagueBookingFlow();
}

function buildLeaguePayload() {
  return {
    discipline: leagueBookingState.values.discipline,
    season_label: leagueBookingState.values.seasonLabel,
    season_start_sunday: leagueBookingState.values.seasonStartSunday,
    lane_label: leagueBookingState.values.laneLabel,
    lane_date: leagueBookingState.values.laneDate,
    lane_time: leagueBookingState.values.laneTime,
    player: {
      first_name: leagueBookingState.values.first_name.trim(),
      last_name: leagueBookingState.values.last_name.trim(),
      email: leagueBookingState.values.email.trim(),
      phone: leagueBookingState.values.phone.trim() || null,
      experience_level: leagueBookingState.values.experience_level,
      notes: leagueBookingState.values.notes.trim() || null,
      marketing_opt_in: Boolean(leagueBookingState.values.marketing_opt_in)
    },
    registration_source: "public_league_modal"
  };
}

async function submitLeagueBooking() {
  if (leagueBookingState.isSubmitting) return;
  if (!leagueStepIsValid(4)) return;

  leagueBookingState.isSubmitting = true;
  renderLeagueBookingFlow();

  try {
    const payload = buildLeaguePayload();

    if (window.TEX_AXES_LEAGUE_BOOKING && typeof window.TEX_AXES_LEAGUE_BOOKING.submit === "function") {
      await window.TEX_AXES_LEAGUE_BOOKING.submit(payload);
      alert("League registration request submitted.");
      closeLeagueBookingModal();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("texaxes:league-booking-submit", {
        detail: payload
      })
    );

    alert("League registration details captured. Wire a real submit handler with window.TEX_AXES_LEAGUE_BOOKING.submit(payload) when the backend is ready.");
    closeLeagueBookingModal();
  } catch (error) {
    console.error("League booking submit failed", error);
    alert("Something went wrong while submitting your league registration.");
  } finally {
    leagueBookingState.isSubmitting = false;
    renderLeagueBookingFlow();
  }
}

function renderLeagueStepPills() {
  const titles = getLeagueStepTitles();

  return `
    <div class="tx-league-steps">
      ${titles
        .map((title, index) => {
          const step = index + 1;
          const activeClass = step === leagueBookingState.step ? "is-active" : "";
          return `
            <div class="tx-league-step-pill ${activeClass}">
              <div class="tx-league-step-number">Step ${step}</div>
              <div class="tx-league-step-label">${title}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderLeagueStepOne() {
  const options = getLeagueDisciplineOptions();

  return `
    <div>
      <div class="tx-league-step-head">
        <h3 class="tx-league-step-title">Which league are you joining?</h3>
        <p class="tx-league-step-copy">
          Start with the discipline you want to register for. You’ll choose the season lane and weekly slot next.
        </p>
      </div>

      <div class="tx-league-grid-2">
        ${options
          .map((option) => {
            const selected = leagueBookingState.values.discipline === option.key ? "is-selected" : "";
            return `
              <button
                type="button"
                class="tx-league-choice ${selected}"
                data-league-discipline="${option.key}"
              >
                <div class="tx-league-choice-title">${option.title}</div>
                <div class="tx-league-choice-meta">${option.meta}</div>
                <p class="tx-league-choice-copy">${option.copy}</p>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderLeagueStepTwo() {
  const selectedDiscipline =
    getLeagueDisciplineOptions().find((item) => item.key === leagueBookingState.values.discipline)?.title ||
    "League";

  return `
    <div>
      <div class="tx-league-step-head">
        <h3 class="tx-league-step-title">Choose your season lane</h3>
        <p class="tx-league-step-copy">
          ${selectedDiscipline} uses the season dates already posted on the site. Choose the lane that fits your weekly schedule.
        </p>
      </div>

      <div class="tx-league-grid-2">
        ${leagueBookingState.seasonOptions
          .map((option) => {
            const selected =
              leagueBookingState.values.seasonLabel === option.seasonLabel &&
              leagueBookingState.values.laneLabel === option.laneLabel &&
              leagueBookingState.values.laneTime === option.laneTime
                ? "is-selected"
                : "";

            return `
              <button
                type="button"
                class="tx-league-slot ${selected}"
                data-league-season-id="${option.id}"
              >
                <div class="tx-league-slot-title">${option.seasonLabel}</div>
                <div class="tx-league-slot-copy">
                  <div>${option.laneLabel}</div>
                  <div>${option.laneDateDisplay}</div>
                  <div>${option.laneTime}</div>
                </div>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderLeagueStepThree() {
  const v = leagueBookingState.values;
  const firstNameInvalid = v.first_name.trim().length === 0;
  const lastNameInvalid = v.last_name.trim().length === 0;
  const emailInvalid = v.email.trim().length > 0 && !isValidEmail(v.email);

  return `
    <div>
      <div class="tx-league-step-head">
        <h3 class="tx-league-step-title">Who is registering?</h3>
        <p class="tx-league-step-copy">
          Add your player details so the league registration can be reviewed and confirmed.
        </p>
      </div>

      <div class="tx-league-grid-2">
        <div class="tx-league-field">
          <label class="tx-league-label" for="tx-league-first-name">First name</label>
          <input id="tx-league-first-name" class="tx-league-input ${firstNameInvalid ? "tx-league-field-error" : ""}" type="text" value="${v.first_name}" />
        </div>

        <div class="tx-league-field">
          <label class="tx-league-label" for="tx-league-last-name">Last name</label>
          <input id="tx-league-last-name" class="tx-league-input ${lastNameInvalid ? "tx-league-field-error" : ""}" type="text" value="${v.last_name}" />
        </div>
      </div>

      <div class="tx-league-grid-2">
        <div class="tx-league-field">
          <label class="tx-league-label" for="tx-league-email">Email</label>
          <input id="tx-league-email" class="tx-league-input ${emailInvalid ? "tx-league-field-error" : ""}" type="email" value="${v.email}" />
          <div class="tx-league-inline-note">League confirmation and follow-up will go here.</div>
        </div>

        <div class="tx-league-field">
          <label class="tx-league-label" for="tx-league-phone">Phone</label>
          <input id="tx-league-phone" class="tx-league-input" type="tel" value="${v.phone}" />
          <div class="tx-league-inline-note">Helpful if someone needs to confirm your lane.</div>
        </div>
      </div>

      <div class="tx-league-field">
        <label class="tx-league-label" for="tx-league-experience">Experience level</label>
        <select id="tx-league-experience" class="tx-league-select">
          <option value="new" ${v.experience_level === "new" ? "selected" : ""}>New to league play</option>
          <option value="returning" ${v.experience_level === "returning" ? "selected" : ""}>Returning league thrower</option>
          <option value="experienced" ${v.experience_level === "experienced" ? "selected" : ""}>Experienced / competitive</option>
        </select>
      </div>

      <div class="tx-league-field">
        <label class="tx-league-label" for="tx-league-notes">Notes</label>
        <textarea id="tx-league-notes" class="tx-league-textarea" placeholder="Anything we should know about your registration?">${v.notes}</textarea>
        <div class="tx-league-inline-note">Optional: teammate preferences, questions, or anything helpful for coordination.</div>
      </div>

      <label class="tx-league-checkbox">
        <input id="tx-league-marketing-opt-in" type="checkbox" ${v.marketing_opt_in ? "checked" : ""} />
        <span>I’m okay receiving occasional league updates or announcements from Tex Axes.</span>
      </label>

      ${emailInvalid ? `<div class="tx-league-error">Please enter a valid email address to continue.</div>` : ""}
    </div>
  `;
}

function renderLeagueStepFour() {
  const v = leagueBookingState.values;
  const disciplineTitle =
    getLeagueDisciplineOptions().find((item) => item.key === v.discipline)?.title || v.discipline;

  return `
    <div>
      <div class="tx-league-step-head">
        <h3 class="tx-league-step-title">Review your registration</h3>
        <p class="tx-league-step-copy">
          Review the details below, then send your registration through for confirmation.
        </p>
      </div>

      <div class="tx-league-kv"><span>Discipline</span><strong>${disciplineTitle}</strong></div>
      <div class="tx-league-kv"><span>Season</span><strong>${v.seasonLabel || "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Lane</span><strong>${v.laneLabel || "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Start date</span><strong>${v.laneDate ? formatLeagueLongDate(parseLeagueDate(v.laneDate)) : "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Time</span><strong>${v.laneTime || "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Player</span><strong>${v.first_name || ""} ${v.last_name || ""}</strong></div>
      <div class="tx-league-kv"><span>Email</span><strong>${v.email || "Not added"}</strong></div>

      <div class="tx-league-inline-note" style="margin-top:16px;">
        This flow captures the league registration request. Final placement and confirmation should be handled by the configured registration process.
      </div>
    </div>
  `;
}

function renderLeagueMainStepContent() {
  if (leagueBookingState.step === 1) return renderLeagueStepOne();
  if (leagueBookingState.step === 2) return renderLeagueStepTwo();
  if (leagueBookingState.step === 3) return renderLeagueStepThree();
  return renderLeagueStepFour();
}

function renderLeagueSidePanel() {
  const side = leagueBookingState.modal.querySelector("#tx-league-side");
  const v = leagueBookingState.values;
  const disciplineTitle =
    getLeagueDisciplineOptions().find((item) => item.key === v.discipline)?.title || "League";

  side.innerHTML = `
    <div class="tx-league-side-block">
      <h4 class="tx-league-side-title">League registration</h4>
      <div class="tx-league-kv"><span>Discipline</span><strong>${disciplineTitle}</strong></div>
      <div class="tx-league-kv"><span>Season</span><strong>${v.seasonLabel || "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Lane</span><strong>${v.laneLabel || "Not selected"}</strong></div>
      <div class="tx-league-kv"><span>Time</span><strong>${v.laneTime || "Not selected"}</strong></div>
    </div>

    <div class="tx-league-side-block">
      <h4 class="tx-league-side-title">Registration status</h4>
      <div class="tx-league-inline-note">
        ${
          leagueBookingState.step < 4
            ? `Step ${leagueBookingState.step} of 4`
            : "Ready to submit registration"
        }
      </div>
      <div class="tx-league-inline-note" style="margin-top:12px;">
        Final confirmation should be completed by your actual league registration workflow or backend.
      </div>
    </div>
  `;
}

function renderLeagueMainPanel() {
  const main = leagueBookingState.modal.querySelector("#tx-league-main");

  main.innerHTML = `
    ${renderLeagueStepPills()}
    ${renderLeagueMainStepContent()}
    <div class="tx-league-actions">
      <div class="tx-league-inline-note">
        ${
          leagueBookingState.step < 4
            ? `Step ${leagueBookingState.step} of 4`
            : "Ready to submit league registration"
        }
      </div>

      <div class="tx-league-btn-row">
        ${leagueBookingState.step > 1 ? `<button type="button" class="tx-league-btn" id="tx-league-prev-step">Back</button>` : ""}
        ${
          leagueBookingState.step < 4
            ? `<button type="button" class="tx-league-btn tx-league-btn-primary" id="tx-league-next-step" ${leagueStepIsValid(leagueBookingState.step) ? "" : "disabled"}>${getLeagueNextStepLabel()}</button>`
            : `<button type="button" class="tx-league-btn tx-league-btn-primary" id="tx-league-submit" ${leagueStepIsValid(4) && !leagueBookingState.isSubmitting ? "" : "disabled"}>
                ${leagueBookingState.isSubmitting ? "Submitting..." : "Submit Registration"}
               </button>`
        }
      </div>
    </div>
  `;
}

function renderLeagueBookingFlow() {
  if (!leagueBookingState.modal) return;
  syncLeagueSeasonOptions();
  renderLeagueMainPanel();
  renderLeagueSidePanel();
  attachLeagueMainPanelEvents();
}

function attachLeagueMainPanelEvents() {
  const main = leagueBookingState.modal.querySelector("#tx-league-main");

  main.querySelectorAll("[data-league-discipline]").forEach((button) => {
    button.addEventListener("click", () => {
      leagueBookingState.values.discipline = button.getAttribute("data-league-discipline") || "hatchet";
      leagueBookingState.values.seasonLabel = "";
      leagueBookingState.values.seasonStartSunday = "";
      leagueBookingState.values.laneLabel = "";
      leagueBookingState.values.laneDate = "";
      leagueBookingState.values.laneTime = "";
      renderLeagueBookingFlow();
    });
  });

  main.querySelectorAll("[data-league-season-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-league-season-id");
      const season = leagueBookingState.seasonOptions.find((item) => item.id === id);
      if (!season) return;

      leagueBookingState.values.seasonLabel = season.seasonLabel;
      leagueBookingState.values.seasonStartSunday = season.seasonStartSunday;
      leagueBookingState.values.laneLabel = season.laneLabel;
      leagueBookingState.values.laneDate = season.laneDate;
      leagueBookingState.values.laneTime = season.laneTime;
      renderLeagueBookingFlow();
    });
  });

  const firstName = main.querySelector("#tx-league-first-name");
  if (firstName) {
    firstName.addEventListener("input", (event) => {
      leagueBookingState.values.first_name = event.target.value;
      renderLeagueSidePanel();
      updateLeagueCurrentStepButtonState();
    });
  }

  const lastName = main.querySelector("#tx-league-last-name");
  if (lastName) {
    lastName.addEventListener("input", (event) => {
      leagueBookingState.values.last_name = event.target.value;
      renderLeagueSidePanel();
      updateLeagueCurrentStepButtonState();
    });
  }

  const email = main.querySelector("#tx-league-email");
  if (email) {
    email.addEventListener("input", (event) => {
      leagueBookingState.values.email = event.target.value;
      renderLeagueSidePanel();
      updateLeagueCurrentStepButtonState();
    });
  }

  const phone = main.querySelector("#tx-league-phone");
  if (phone) {
    phone.addEventListener("input", (event) => {
      leagueBookingState.values.phone = event.target.value;
      renderLeagueSidePanel();
      updateLeagueCurrentStepButtonState();
    });
  }

  const experience = main.querySelector("#tx-league-experience");
  if (experience) {
    experience.addEventListener("change", (event) => {
      leagueBookingState.values.experience_level = event.target.value;
      updateLeagueCurrentStepButtonState();
    });
  }

  const notes = main.querySelector("#tx-league-notes");
  if (notes) {
    notes.addEventListener("input", (event) => {
      leagueBookingState.values.notes = event.target.value;
      updateLeagueCurrentStepButtonState();
    });
  }

  const marketingOptIn = main.querySelector("#tx-league-marketing-opt-in");
  if (marketingOptIn) {
    marketingOptIn.addEventListener("change", (event) => {
      leagueBookingState.values.marketing_opt_in = Boolean(event.target.checked);
      updateLeagueCurrentStepButtonState();
    });
  }

  const prevBtn = main.querySelector("#tx-league-prev-step");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      setLeagueStep(leagueBookingState.step - 1);
    });
  }

  const nextBtn = main.querySelector("#tx-league-next-step");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (leagueStepIsValid(leagueBookingState.step)) {
        setLeagueStep(leagueBookingState.step + 1);
      } else if (leagueBookingState.step === 3) {
        renderLeagueBookingFlow();
      }
    });
  }

  const submitBtn = main.querySelector("#tx-league-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitLeagueBooking);
  }
}

function updateLeagueCurrentStepButtonState() {
  if (!leagueBookingState.modal) return;
  const nextBtn = leagueBookingState.modal.querySelector("#tx-league-next-step");
  const submitBtn = leagueBookingState.modal.querySelector("#tx-league-submit");

  if (nextBtn) {
    nextBtn.disabled = !leagueStepIsValid(leagueBookingState.step);
    nextBtn.textContent = getLeagueNextStepLabel();
  }

  if (submitBtn) {
    submitBtn.disabled = !(leagueStepIsValid(4) && !leagueBookingState.isSubmitting);
  }
}

function wireLeagueBookingButtons() {
  const selectors = [
    "[data-league-booking]",
    ".js-league-booking",
    ".league-cta",
    ".league-register-btn"
  ];

  const seen = new WeakSet();

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (seen.has(el)) return;

      const text = (el.textContent || "").toLowerCase();
      const isLeagueTrigger =
        el.hasAttribute("data-league-booking") ||
        el.classList.contains("js-league-booking") ||
        text.includes("join league") ||
        text.includes("register") ||
        text.includes("book league");

      if (!isLeagueTrigger) return;

      el.addEventListener("click", async (event) => {
        event.preventDefault();
        await ensureLeagueData();

        const discipline = el.getAttribute("data-league-discipline") || "";
        openLeagueBookingModal(discipline);
      });

      seen.add(el);
    });
  });
}

export function initLeagueCallout() {
  const root = document.querySelector("#league-callout-section .league-section");
  if (!root) return;

  const data = window.TEX_AXES_LEAGUE_DATES;
  if (!data || !Array.isArray(data.seasons) || !data.seasons.length) return;

  wireLeagueBookingButtons();
  createLeagueBookingModal();

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

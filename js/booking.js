const BOOKING_API_BASE = "https://texaxes-ops.vercel.app/api";
const PUBLIC_MAX_PARTY_SIZE = 24;

const bookingState = {
  modal: null,
  isOpen: false,
  isSubmitting: false,
  availabilityLoading: false,
  step: 1,
  availability: [],
  selectedSlot: null,
  values: {
    experience: "axe_throwing",
    throwers: 4,
    date: "",
    addons: {
      byob_guests: 0,
      wktl_knife_rental_qty: 0,
      pro_axe_qty: 0,
      big_axe_qty: 0,
      shovel_qty: 0
    },
    customer: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      birth_date: "",
      is_minor: false,
      notes: "",
      marketing_opt_in: false
    }
  }
};

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getTodayLocalDate() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function getInitialBookingDate() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  const tzOffsetMs = next.getTimezoneOffset() * 60000;
  return new Date(next.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function formatDisplayDate(value) {
  if (!value) return "Not selected";

  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return value;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function computeLocalPricingSnapshot() {
  const throwers = Number(bookingState.values.throwers || 0);
  const addons = bookingState.values.addons;

  const basePrice = throwers * 29;
  const addonsSubtotal =
    (Number(addons.byob_guests || 0) * 5) +
    (Number(addons.wktl_knife_rental_qty || 0) * 20) +
    (Number(addons.pro_axe_qty || 0) * 10) +
    (Number(addons.big_axe_qty || 0) * 15) +
    (Number(addons.shovel_qty || 0) * 20);

  const subtotal = basePrice + addonsSubtotal;
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  return {
    basePrice,
    addonsSubtotal,
    subtotal,
    tax,
    total
  };
}

function getStepTitles() {
  return [
    "Experience",
    "Group",
    "Time",
    "Details",
    "Upgrades",
    "Review"
  ];
}

function getExperienceOptions() {
  return [
    {
      key: "axe_throwing",
      title: "Axe Throwing",
      copy: "Perfect for first-timers, date nights, birthdays, and repeat throwers.",
      meta: "Starts at $29 per thrower",
      sell: "Coaching included • No experience needed • Real league lanes"
    },
    {
      key: "large_group",
      title: "Group Events",
      copy: "Best for team outings, celebrations, parties, and larger hosted experiences.",
      meta: "Ideal for bigger groups",
      sell: "Great for work events • Higher-touch coordination • Built for shared experiences"
    }
  ];
}

function ensureBookingStyles() {
  if (document.getElementById("texaxes-booking-styles")) return;

  const style = document.createElement("style");
  style.id = "texaxes-booking-styles";
  style.textContent = `
    .tx-booking-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 28px;
      background: rgba(4, 8, 18, 0.78);
      backdrop-filter: blur(14px);
    }

    .tx-booking-overlay.is-open {
      display: flex;
    }

    .tx-booking-modal {
      width: min(1240px, 100%);
      max-height: calc(100vh - 40px);
      overflow: auto;
      border-radius: 32px;
      color: #f5f7fb;
      background:
        radial-gradient(circle at top left, rgba(92, 125, 255, 0.18), transparent 30%),
        radial-gradient(circle at bottom right, rgba(255, 122, 89, 0.22), transparent 28%),
        linear-gradient(180deg, rgba(12, 18, 36, 0.98), rgba(8, 12, 24, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);
    }

    .tx-booking-shell {
      padding: 34px;
    }

    .tx-booking-top {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 24px;
    }

    .tx-booking-title {
      margin: 0;
      font-size: clamp(2rem, 3.4vw, 3rem);
      letter-spacing: -0.04em;
      line-height: 1;
      color: #ffffff;
    }

    .tx-booking-subtitle {
      margin: 10px 0 0;
      color: rgba(255,255,255,0.78);
      max-width: 64ch;
      line-height: 1.6;
      font-size: 1rem;
    }

    .tx-booking-close {
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

    .tx-booking-close:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.1);
      border-color: rgba(255,122,89,0.34);
    }

    .tx-booking-layout {
      display: grid;
      grid-template-columns: 1.6fr 0.85fr;
      gap: 26px;
    }

    .tx-booking-main,
    .tx-booking-side {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      border-radius: 26px;
      padding: 26px;
    }

    .tx-booking-side {
      background:
        linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    }

    .tx-steps {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 26px;
    }

    .tx-step-pill {
      border-radius: 16px;
      padding: 11px 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      min-height: 68px;
      transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
    }

    .tx-step-pill.is-active {
      background: linear-gradient(
        135deg,
        rgba(255,122,89,0.18),
        rgba(255,122,89,0.08)
      );
      border-color: rgba(255,122,89,0.56);
      box-shadow:
        inset 0 0 0 1px rgba(255,122,89,0.16),
        0 12px 24px rgba(255,122,89,0.08);
      transform: translateY(-1px);
    }

    .tx-step-number {
      font-size: 0.74rem;
      color: rgba(255,255,255,0.56);
      margin-bottom: 7px;
    }

    .tx-step-label {
      font-size: 0.94rem;
      line-height: 1.28;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .tx-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .tx-card-choice,
    .tx-slot-card,
    .tx-count-chip {
      appearance: none;
      width: 100%;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      border-radius: 22px;
      padding: 20px;
      cursor: pointer;
      text-align: left;
      color: #ffffff;
      transition:
        transform 180ms ease,
        border-color 180ms ease,
        background 180ms ease,
        box-shadow 180ms ease;
    }

    .tx-card-choice:hover,
    .tx-slot-card:hover,
    .tx-count-chip:hover {
      transform: translateY(-2px) scale(1.01);
      border-color: rgba(255,122,89,0.34);
      background: rgba(255,255,255,0.07);
      box-shadow: 0 16px 34px rgba(0,0,0,0.2);
    }

    .tx-card-choice.is-selected,
    .tx-slot-card.is-selected,
    .tx-count-chip.is-selected {
      border-color: rgba(255,122,89,0.7);
      background: linear-gradient(
        135deg,
        rgba(255,122,89,0.18),
        rgba(255,122,89,0.08)
      );
      box-shadow:
        inset 0 0 0 1px rgba(255,122,89,0.2),
        0 24px 50px rgba(255,122,89,0.18);
      transform: scale(1.025);
    }

    .tx-card-choice.is-disabled,
    .tx-slot-card.is-disabled {
      opacity: 0.48;
      cursor: not-allowed;
      pointer-events: none;
    }

    .tx-step-head {
      margin-bottom: 18px;
    }

    .tx-step-title {
      margin: 0 0 8px;
      font-size: 1.28rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .tx-step-copy {
      margin: 0;
      color: rgba(255,255,255,0.76);
      line-height: 1.55;
      font-size: 0.98rem;
    }

    .tx-card-title {
      font-size: 1.16rem;
      font-weight: 900;
      margin: 0 0 8px;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .tx-card-copy {
      margin: 0;
      color: rgba(255,255,255,0.82);
      line-height: 1.55;
      font-size: 0.97rem;
    }

    .tx-card-meta {
      margin-top: 10px;
      font-size: 0.98rem;
      font-weight: 800;
      color: #ffd1bd;
    }

    .tx-card-sell {
      margin-top: 10px;
      font-size: 0.9rem;
      line-height: 1.5;
      color: rgba(255,255,255,0.94);
    }

    .tx-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
      min-width: 0;
    }

    .tx-label {
      font-size: 0.9rem;
      font-weight: 800;
      color: #ffffff;
    }

    .tx-input,
    .tx-select,
    .tx-textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(8, 12, 22, 0.84);
      color: #ffffff;
      border-radius: 15px;
      padding: 13px 14px;
      font: inherit;
      box-sizing: border-box;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .tx-input:focus,
    .tx-select:focus,
    .tx-textarea:focus {
      outline: none;
      border-color: rgba(255,122,89,0.52);
      box-shadow: 0 0 0 3px rgba(255,122,89,0.12);
      background: rgba(10, 14, 26, 0.92);
    }

    .tx-input::placeholder,
    .tx-textarea::placeholder {
      color: rgba(255,255,255,0.42);
    }

    .tx-input[type="date"] {
      appearance: none;
      -webkit-appearance: none;
      min-height: 52px;
      cursor: pointer;
    }

    .tx-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.88;
      cursor: pointer;
    }

    .tx-textarea {
      min-height: 124px;
      resize: vertical;
      background: linear-gradient(
        180deg,
        rgba(10,14,26,0.9),
        rgba(8,12,22,0.9)
      );
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.25);
    }

    .tx-inline-note,
    .tx-error,
    .tx-muted {
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .tx-inline-note,
    .tx-muted {
      color: rgba(255,255,255,0.72);
    }

    .tx-error {
      color: #ffb7ae;
      margin-top: 12px;
    }

    .tx-field-error {
      border-color: rgba(255, 122, 89, 0.52);
      box-shadow: 0 0 0 1px rgba(255, 122, 89, 0.18);
    }

    .tx-slot-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .tx-slot-card {
      padding: 20px;
      border-radius: 20px;
    }

    .tx-slot-card.is-selected {
      transform: scale(1.03);
      box-shadow:
        0 20px 40px rgba(255,122,89,0.2),
        inset 0 0 0 1px rgba(255,122,89,0.22);
    }

    .tx-slot-time {
      font-size: 1.08rem;
      font-weight: 900;
      margin-bottom: 8px;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-slot-meta {
      color: rgba(255,255,255,0.8);
      font-size: 0.92rem;
      line-height: 1.42;
    }

    .tx-status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 999px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 0.82rem;
      font-weight: 800;
      color: #ffffff;
    }

    .tx-addon-row,
    .tx-summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .tx-addon-row {
      border-radius: 18px;
      padding: 16px 18px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      margin-bottom: 12px;
      transition: all 180ms ease;
    }

    .tx-addon-row:hover {
      transform: translateY(-2px);
      border-color: rgba(255,122,89,0.35);
      background: rgba(255,255,255,0.06);
    }

    .tx-addon-row:last-child,
    .tx-summary-row:last-child {
      border-bottom: 0;
    }

    .tx-addon-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .tx-addon-title {
      font-weight: 900;
      color: #ffffff;
      font-size: 1rem;
      letter-spacing: -0.02em;
    }

    .tx-addon-meta {
      color: #ffd1bd;
      font-size: 0.9rem;
      font-weight: 800;
    }

    .tx-addon-sell {
      color: rgba(255,255,255,0.92);
      font-size: 0.9rem;
      line-height: 1.45;
      margin-top: 2px;
    }

    .tx-qty {
      width: 82px;
      flex-shrink: 0;
      text-align: center;
      font-weight: 800;
      background: rgba(8,12,22,0.9);
      border: 1px solid rgba(255,255,255,0.2);
    }

    .tx-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 24px;
    }

    .tx-btn-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .tx-btn {
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

    .tx-btn:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.08);
    }

    .tx-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .tx-btn-primary {
      background: linear-gradient(135deg, rgba(255,122,89,0.98), rgba(234,94,73,0.96));
      border-color: rgba(255,122,89,0.42);
      box-shadow: 0 18px 40px rgba(255,122,89,0.28);
      padding: 14px 22px;
      font-size: 1rem;
      border-radius: 16px;
    }

    .tx-btn-primary:hover {
      background: linear-gradient(135deg, rgba(255,132,99,1), rgba(240,102,81,0.98));
      transform: translateY(-2px) scale(1.02);
    }

    .tx-side-block + .tx-side-block {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .tx-side-title {
      margin: 0 0 12px;
      font-size: 1.04rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-kv {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 9px 0;
      color: rgba(255,255,255,0.82);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .tx-kv strong {
      color: #ffffff;
      text-align: right;
      font-size: 1rem;
      font-weight: 900;
    }

    .tx-checkbox {
      display: flex;
      align-items: start;
      gap: 10px;
      color: rgba(255,255,255,0.82);
      line-height: 1.48;
      font-size: 0.93rem;
    }

    .tx-empty {
      border-radius: 16px;
      padding: 18px;
      background: rgba(255,255,255,0.04);
      border: 1px dashed rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.72);
    }

    .tx-party-shell {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 18px;
      margin-top: 4px;
    }

    .tx-party-card {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.04);
      border-radius: 22px;
      padding: 20px;
    }

    .tx-party-title {
      margin: 0 0 8px;
      font-size: 1.02rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-party-copy {
      margin: 0 0 14px;
      color: rgba(255,255,255,0.72);
      line-height: 1.52;
      font-size: 0.93rem;
    }

    .tx-count-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .tx-count-chip {
      padding: 14px 10px;
      text-align: center;
      border-radius: 16px;
    }

    .tx-count-value {
      font-size: 1.06rem;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .tx-count-meta {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.66);
      line-height: 1.3;
    }

    .tx-date-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      border: 1px solid rgba(255,255,255,0.08);
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03));
      border-radius: 18px;
      padding: 14px 16px;
      margin-bottom: 14px;
    }

    .tx-date-hero-label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(255,255,255,0.56);
      margin-bottom: 4px;
    }

    .tx-date-hero-value {
      font-size: 1.08rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .tx-date-hero-note {
      font-size: 0.88rem;
      color: rgba(255,255,255,0.68);
      text-align: right;
      line-height: 1.45;
    }

    .tx-step-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 18px;
      border-radius: 18px;
      padding: 15px 16px;
      background: linear-gradient(
        135deg,
        rgba(255,122,89,0.12),
        rgba(255,255,255,0.04)
      );
      border: 1px solid rgba(255,122,89,0.2);
    }

    .tx-step-banner strong {
      color: #ffffff;
      display: block;
      margin-bottom: 4px;
      letter-spacing: -0.02em;
    }

    .tx-step-banner span {
      color: rgba(255,255,255,0.72);
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .tx-step-banner-price {
      text-align: right;
      flex-shrink: 0;
    }

    .tx-step-banner-price .tx-price {
      display: block;
      font-size: 1.24rem;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.03em;
    }

    .tx-step-banner-price .tx-price-meta {
      color: rgba(255,255,255,0.68);
      font-size: 0.82rem;
    }

    @media (max-width: 960px) {
      .tx-booking-layout {
        grid-template-columns: 1fr;
      }

      .tx-steps {
        grid-template-columns: repeat(2, 1fr);
      }

      .tx-slot-grid,
      .tx-grid-3,
      .tx-grid-2,
      .tx-party-shell,
      .tx-count-grid {
        grid-template-columns: 1fr;
      }

      .tx-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .tx-btn-row {
        justify-content: flex-end;
      }

      .tx-date-hero,
      .tx-step-banner {
        flex-direction: column;
        align-items: stretch;
      }

      .tx-date-hero-note,
      .tx-step-banner-price {
        text-align: left;
      }
    }
  `;
  document.head.appendChild(style);
}

function createBookingModal() {
  if (bookingState.modal) return bookingState.modal;

  ensureBookingStyles();

  const overlay = document.createElement("div");
  overlay.className = "tx-booking-overlay";
  overlay.innerHTML = `
    <div class="tx-booking-modal" role="dialog" aria-modal="true" aria-labelledby="tx-booking-title">
      <div class="tx-booking-shell">
        <div class="tx-booking-top">
          <div>
            <h2 class="tx-booking-title" id="tx-booking-title">Book Your Experience</h2>
            <p class="tx-booking-subtitle">
              Book your lane, choose your time, and build your experience in minutes.
            </p>
          </div>
          <button class="tx-booking-close" type="button" aria-label="Close booking flow">✕</button>
        </div>

        <div class="tx-booking-layout">
          <div class="tx-booking-main" id="tx-booking-main"></div>
          <aside class="tx-booking-side" id="tx-booking-side"></aside>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeBookingModal();
    }
  });

  const closeBtn = overlay.querySelector(".tx-booking-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeBookingModal);
  }

  bookingState.modal = overlay;
  return overlay;
}

function openBookingModal() {
  createBookingModal();

  if (!bookingState.values.date) {
    bookingState.values.date = getInitialBookingDate();
  }

  bookingState.isOpen = true;
  bookingState.modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
  renderBookingFlow();
}

function closeBookingModal() {
  if (!bookingState.modal) return;
  bookingState.isOpen = false;
  bookingState.modal.classList.remove("is-open");
  document.body.style.overflow = "";
}

// 👇 ADD THIS RIGHT HERE
window.closeBookingAndScrollToLuke = function () {
  closeBookingModal();

  requestAnimationFrame(() => {
    document.getElementById("contact-luke")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });
};

function setBookingStep(step) {
  bookingState.step = Math.max(1, Math.min(6, step));
  renderBookingFlow();
}

function stepIsValid(step) {
  const values = bookingState.values;

  if (step === 1) {
    return Boolean(values.experience);
  }

  if (step === 2) {
    return (
      Number.isInteger(Number(values.throwers)) &&
      Number(values.throwers) > 0 &&
      Number(values.throwers) <= PUBLIC_MAX_PARTY_SIZE &&
      Boolean(values.date)
    );
  }

  if (step === 3) {
    return Boolean(bookingState.selectedSlot);
  }

  if (step === 4) {
    return (
      values.customer.first_name.trim().length > 0 &&
      values.customer.last_name.trim().length > 0 &&
      isValidEmail(values.customer.email)
    );
  }

  if (step === 5) {
    return true;
  }

  if (step === 6) {
    return stepIsValid(1) && stepIsValid(2) && stepIsValid(3) && stepIsValid(4);
  }

  return false;
}

function normalizeIntegerInput(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

function getNextStepLabel() {
  if (bookingState.step === 1) return "Choose Group & Date";
  if (bookingState.step === 2) return "See Available Times";
  if (bookingState.step === 3) return "Continue to Details";
  if (bookingState.step === 4) return "Review Upgrades";
  if (bookingState.step === 5) return "Review Booking";
  return "Continue";
}

function updateCurrentStepButtonState() {
  if (!bookingState.modal) return;
  const nextBtn = bookingState.modal.querySelector("#tx-next-step");
  const submitBtn = bookingState.modal.querySelector("#tx-submit-booking");

  if (nextBtn) {
    nextBtn.disabled = !stepIsValid(bookingState.step);
    nextBtn.textContent = getNextStepLabel();
  }

  if (submitBtn) {
    submitBtn.disabled = !(stepIsValid(6) && !bookingState.isSubmitting);
  }
}

async function loadAvailability() {
  if (!bookingState.values.date || !bookingState.values.throwers) return;

  bookingState.availabilityLoading = true;
  bookingState.availability = [];
  bookingState.selectedSlot = null;
  renderBookingFlow();

  try {
    const params = new URLSearchParams({
      date: bookingState.values.date,
      throwers: String(bookingState.values.throwers)
    });

    const response = await fetch(
      `https://texaxes-ops.vercel.app/availability?${params.toString()}`,
      {
        method: "GET"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to load availability");
    }

    bookingState.availability = Array.isArray(data.slots) ? data.slots : [];
  } catch (error) {
    console.error("Availability load failed", error);
    bookingState.availability = [];
  } finally {
    bookingState.availabilityLoading = false;
    renderBookingFlow();
  }
}

function getAvailabilityHint() {
  if (!bookingState.values.date || !bookingState.values.throwers) {
    return "Choose your group size and date to load live times.";
  }

  if (bookingState.availabilityLoading) {
    return "Loading live availability…";
  }

  if (!bookingState.availability.length) {
    return "No online times are currently available for that date and group size. Try another date.";
  }

  return "Select a live time below. Weekend times can fill quickly.";
}

function getSelectedExperienceTitle() {
  const option = getExperienceOptions().find((item) => item.key === bookingState.values.experience);
  return option ? option.title : "Axe Throwing";
}

function buildBookingPayload() {
  return {
    date: bookingState.values.date,
    time: bookingState.selectedSlot ? bookingState.selectedSlot.start : "",
    throwers: Number(bookingState.values.throwers),
    customer: {
      first_name: bookingState.values.customer.first_name.trim(),
      last_name: bookingState.values.customer.last_name.trim(),
      email: bookingState.values.customer.email.trim(),
      phone: bookingState.values.customer.phone.trim() || null,
      birth_date: bookingState.values.customer.birth_date || null,
      is_minor: Boolean(bookingState.values.customer.is_minor),
      notes: bookingState.values.customer.notes.trim() || null,
      marketing_opt_in: Boolean(bookingState.values.customer.marketing_opt_in)
    },
    addons: {
      byob_guests: Number(bookingState.values.addons.byob_guests || 0),
      wktl_knife_rental_qty: Number(bookingState.values.addons.wktl_knife_rental_qty || 0),
      pro_axe_qty: Number(bookingState.values.addons.pro_axe_qty || 0),
      big_axe_qty: Number(bookingState.values.addons.big_axe_qty || 0),
      shovel_qty: Number(bookingState.values.addons.shovel_qty || 0)
    },
    booking_source: "public",
    booking_type: "open",
    customer_notes:
      bookingState.values.experience === "large_group"
        ? "Customer selected Group Events path from Tex Axes public booking flow."
        : null
  };
}

async function submitBooking() {
  if (bookingState.isSubmitting) return;
  if (!stepIsValid(6)) return;

  bookingState.isSubmitting = true;
  renderBookingFlow();

  try {
    const payload = buildBookingPayload();

    const response = await fetch(`${BOOKING_API_BASE}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      if (response.status === 409) {
        bookingState.step = 3;
        bookingState.selectedSlot = null;
        await loadAvailability();
        alert("That time slot is no longer available. Please choose another time.");
        return;
      }

      alert(data?.error || "Booking could not be created.");
      return;
    }

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
      return;
    }

    alert("Booking was created, but no checkout link was returned.");
  } catch (error) {
    console.error("Booking submit failed", error);
    alert("Something went wrong while starting checkout.");
  } finally {
    bookingState.isSubmitting = false;
    renderBookingFlow();
  }
}

function renderStepPills() {
  const titles = getStepTitles();

  return `
    <div class="tx-steps">
      ${titles
        .map((title, index) => {
          const step = index + 1;
          const activeClass = step === bookingState.step ? "is-active" : "";
          return `
            <div class="tx-step-pill ${activeClass}">
              <div class="tx-step-number">Step ${step}</div>
              <div class="tx-step-label">${title}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderStepOne() {
  const options = getExperienceOptions();

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">What are you booking today?</h3>
        <p class="tx-step-copy">
          Start with your experience. You’ll choose your time and customize everything next.
        </p>
      </div>

      <div class="tx-grid-2">
        ${options
          .map((option) => {
            const selected = bookingState.values.experience === option.key ? "is-selected" : "";
            const isPrimary = option.key === "axe_throwing";

            return `
              <button
                type="button"
                class="tx-card-choice ${selected}"
                data-experience="${option.key}"
              >
                <div class="tx-card-title">${option.title}</div>
                <div class="tx-card-meta" style="font-size:1.1rem;">${option.meta}</div>
                <p class="tx-card-copy" style="margin-top:6px;">${option.copy}</p>
                <div class="tx-card-sell">${option.sell}</div>
                ${
                  isPrimary
                    ? `<div style="margin-top:10px;font-size:0.85rem;color:#ffd1bd;font-weight:800;">Fastest way to book online</div>`
                    : ""
                }
              </button>
            `;
          })
          .join("")}
      </div>

      <div class="tx-inline-note" style="margin-top:16px;">
        Online booking supports up to 24 throwers. Larger or hosted events are better handled through Group Events.
      </div>
    </div>
  `;
}

function renderStepTwo() {
  const throwers = Number(bookingState.values.throwers || 0);
  const presets = [2, 4, 6, 8, 10, 12];
  const pricing = computeLocalPricingSnapshot();

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">Choose your group size and date</h3>
        <p class="tx-step-copy">
          Set the size of your group, pick your date, and then we’ll show the live times that fit your booking.
        </p>
      </div>

      <div class="tx-party-shell">
        <div class="tx-party-card">
          <h4 class="tx-party-title">How many are throwing?</h4>
          <p class="tx-party-copy">
            Most online bookings are small groups, date nights, and celebrations. Start with a quick pick or enter your exact count.
          </p>

          <div class="tx-count-grid">
            ${presets
              .map((count) => {
                const selected = throwers === count ? "is-selected" : "";
                return `
                  <button
                    type="button"
                    class="tx-count-chip ${selected}"
                    data-throwers-preset="${count}"
                  >
                    <div class="tx-count-value">${count}</div>
                    <div class="tx-count-meta">${count === 2 ? "Great for date night" : count <= 6 ? "Popular size" : "Group booking"}</div>
                  </button>
                `;
              })
              .join("")}
          </div>

          <div class="tx-field" style="margin-bottom:0;">
          <label class="tx-label" for="tx-throwers">Exact number of throwers</label>
        <input
          id="tx-throwers"
          class="tx-input"
          type="number"
          min="1"
          max="${PUBLIC_MAX_PARTY_SIZE}"
          value="${bookingState.values.throwers}"
        />
        <div class="tx-inline-note">
          Planning for more than 24 guests?
          <button
            type="button"
            class="tx-inline-link"
            onclick="closeBookingAndScrollToLuke()"
          >
            Contact Luke
          </button>
          and we’ll set up the perfect event for you.
        </div>
        </div>
        <div class="tx-party-card">
          <h4 class="tx-party-title">When do you want to come in?</h4>
          <p class="tx-party-copy">
            Use the calendar picker to choose your date. Friday and Saturday times usually go first.
          </p>

          <div class="tx-date-hero">
            <div>
              <div class="tx-date-hero-label">Selected date</div>
              <div class="tx-date-hero-value">${formatDisplayDate(bookingState.values.date)}</div>
            </div>
            <div class="tx-date-hero-note">
              Live times are pulled from the booking system for this date.
            </div>
          </div>

          <div class="tx-field" style="margin-bottom:0;">
            <label class="tx-label" for="tx-date">Select date</label>
            <input
              id="tx-date"
              class="tx-input"
              type="date"
              min="${getTodayLocalDate()}"
              value="${bookingState.values.date}"
            />
            <div class="tx-inline-note">Choose a date, then continue to see available times.</div>
          </div>
        </div>
      </div>

      <div class="tx-step-banner">
        <div>
          <strong>${throwers} thrower${throwers === 1 ? "" : "s"} selected • ${formatDisplayDate(bookingState.values.date)}</strong>
          <span>Estimated base before upgrades and tax.</span>
        </div>
        <div class="tx-step-banner-price">
          <span class="tx-price">${formatMoney(pricing.basePrice)}</span>
          <span class="tx-price-meta">$29 per thrower</span>
        </div>
      </div>
    </div>
  `;
}

function renderStepThree() {
  const slots = bookingState.availability || [];
  const hint = getAvailabilityHint();

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">Pick your time</h3>
        <p class="tx-step-copy">${hint}</p>
      </div>

      ${
        bookingState.availabilityLoading
          ? `<div class="tx-empty">Loading live availability for ${bookingState.values.date}…</div>`
          : slots.length
            ? `<div class="tx-slot-grid">
                ${slots
                  .map((slot) => {
                    const selected =
                      bookingState.selectedSlot &&
                      bookingState.selectedSlot.time_block_id === slot.time_block_id
                        ? "is-selected"
                        : "";
                    const disabled = slot.state === "full" ? "is-disabled" : "";
                    const stateLabel =
                      slot.state === "available"
                        ? "Available"
                        : slot.state === "limited"
                          ? "Limited"
                          : "Full";

                    return `
                      <button
                        type="button"
                        class="tx-slot-card ${selected} ${disabled}"
                        data-slot-id="${slot.time_block_id}"
                      >
                        <div class="tx-slot-time">${slot.start} – ${slot.end}</div>
                        <div class="tx-slot-meta">
                          <div>${stateLabel}</div>
                          <div>${slot.open_bays} of ${slot.total_bays} bays open</div>
                          ${
                            typeof slot.minimum_bays_required !== "undefined"
                              ? `<div>Minimum bays needed: ${slot.minimum_bays_required}</div>`
                              : ""
                          }
                        </div>
                      </button>
                    `;
                  })
                  .join("")}
              </div>`
            : `<div class="tx-empty">No online time slots are currently available for that date and group size.</div>`
      }
    </div>
  `;
}

function renderStepFour() {
  const customer = bookingState.values.customer;
  const firstNameInvalid = bookingState.step === 4 && customer.first_name.trim().length === 0;
  const lastNameInvalid = bookingState.step === 4 && customer.last_name.trim().length === 0;
  const emailInvalid = bookingState.step === 4 && customer.email.trim().length > 0 && !isValidEmail(customer.email);

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">Who is booking?</h3>
        <p class="tx-step-copy">
          Add your details so we can confirm the booking and send the checkout receipt.
        </p>
      </div>

      <div class="tx-grid-2">
        <div class="tx-field">
          <label class="tx-label" for="tx-first-name">First name</label>
          <input id="tx-first-name" class="tx-input ${firstNameInvalid ? "tx-field-error" : ""}" type="text" value="${customer.first_name}" />
        </div>

        <div class="tx-field">
          <label class="tx-label" for="tx-last-name">Last name</label>
          <input id="tx-last-name" class="tx-input ${lastNameInvalid ? "tx-field-error" : ""}" type="text" value="${customer.last_name}" />
        </div>
      </div>

      <div class="tx-grid-2">
        <div class="tx-field">
          <label class="tx-label" for="tx-email">Email</label>
          <input id="tx-email" class="tx-input ${emailInvalid ? "tx-field-error" : ""}" type="email" value="${customer.email}" />
          <div class="tx-inline-note">Your confirmation and payment receipt will go here.</div>
        </div>

        <div class="tx-field">
          <label class="tx-label" for="tx-phone">Phone</label>
          <input id="tx-phone" class="tx-input" type="tel" value="${customer.phone}" />
          <div class="tx-inline-note">Helpful if we need to reach you about your booking.</div>
        </div>
      </div>

      <div class="tx-grid-2">
        <div class="tx-field">
          <label class="tx-label" for="tx-birth-date">Birth date</label>
          <input id="tx-birth-date" class="tx-input" type="date" value="${customer.birth_date}" />
          <div class="tx-inline-note">Guests under 8 are not eligible for standard axe throwing booking.</div>
        </div>

        <div class="tx-field">
          <label class="tx-label">&nbsp;</label>
          <label class="tx-checkbox">
            <input id="tx-is-minor" type="checkbox" ${customer.is_minor ? "checked" : ""} />
            <span>Booking includes a minor who will require guardian waiver handling.</span>
          </label>
        </div>
      </div>

      <div class="tx-field">
        <label class="tx-label" for="tx-customer-notes">Notes</label>
        <textarea id="tx-customer-notes" class="tx-textarea" placeholder="Anything we should know about your visit?">${customer.notes}</textarea>
        <div class="tx-inline-note">Optional: birthday notes, special requests, or anything helpful for your visit.</div>
      </div>

      <label class="tx-checkbox">
        <input id="tx-marketing-opt-in" type="checkbox" ${customer.marketing_opt_in ? "checked" : ""} />
        <span>I’m okay receiving occasional updates or special offers from Tex Axes.</span>
      </label>

      ${
        emailInvalid
          ? `<div class="tx-error">Please enter a valid email address to continue.</div>`
          : ""
      }
    </div>
  `;
}

function renderAddonRow(id, title, meta, sell, value) {
  return `
    <div class="tx-addon-row">
      <div class="tx-addon-copy">
        <div class="tx-addon-title">${title}</div>
        <div class="tx-addon-meta">${meta}</div>
        <div class="tx-addon-sell">${sell}</div>
      </div>
      <input
        class="tx-input tx-qty"
        type="number"
        min="0"
        value="${value}"
        data-addon-key="${id}"
      />
    </div>
  `;
}

function renderStepFive() {
  const addons = bookingState.values.addons;

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">Upgrade your experience</h3>
        <p class="tx-step-copy">
          Your time is already selected. Most groups add at least one upgrade to make the visit more memorable.
        </p>
      </div>

      ${renderAddonRow(
        "byob_guests",
        "BYOB Guests",
        "$5 per guest",
        "Bring your own drinks and turn it into a full night out.",
        addons.byob_guests
      )}

      ${renderAddonRow(
        "wktl_knife_rental_qty",
        "WKTL Knife Rental",
        "$20 each",
        "Try certified knife throwing — only available at select venues.",
        addons.wktl_knife_rental_qty
      )}

      ${renderAddonRow(
        "pro_axe_qty",
        "Pro Axe",
        "$10 each",
        "Step up from the standard hatchet with a stronger throwing feel.",
        addons.pro_axe_qty
      )}

      ${renderAddonRow(
        "big_axe_qty",
        "Big Axe",
        "$15 each",
        "Add a heavier challenge for guests who want something more intense.",
        addons.big_axe_qty
      )}

      ${renderAddonRow(
        "shovel_qty",
        "Shovel Throw",
        "$20 each",
        "A specialty throw that turns the session into a story people remember.",
        addons.shovel_qty
      )}
    </div>
  `;
}

function renderSummaryRows() {
  const pricing = computeLocalPricingSnapshot();
  const addons = bookingState.values.addons;
  const addonSummary = [
    ["BYOB Guests", addons.byob_guests, 5],
    ["WKTL Knife Rental", addons.wktl_knife_rental_qty, 20],
    ["Pro Axe", addons.pro_axe_qty, 10],
    ["Big Axe", addons.big_axe_qty, 15],
    ["Shovel Throw", addons.shovel_qty, 20]
  ].filter((item) => Number(item[1]) > 0);

  return `
    <div class="tx-summary-row"><span>${bookingState.values.throwers} thrower(s)</span><strong>${formatMoney(pricing.basePrice)}</strong></div>
    ${addonSummary
      .map(([label, qty, unit]) => {
        const lineTotal = Number(qty) * Number(unit);
        return `<div class="tx-summary-row"><span>${label} × ${qty}</span><strong>${formatMoney(lineTotal)}</strong></div>`;
      })
      .join("")}
    <div class="tx-summary-row"><span>Subtotal</span><strong>${formatMoney(pricing.subtotal)}</strong></div>
    <div class="tx-summary-row"><span>Tax</span><strong>${formatMoney(pricing.tax)}</strong></div>
    <div class="tx-summary-row"><span>Total</span><strong>${formatMoney(pricing.total)}</strong></div>
  `;
}

function renderStepSix() {
  const customer = bookingState.values.customer;
  const slot = bookingState.selectedSlot;

  return `
    <div>
      <div class="tx-step-head">
        <h3 class="tx-step-title">Review your booking</h3>
        <p class="tx-step-copy">
          Review everything, then continue to secure your time and complete checkout.
        </p>
      </div>

      <div class="tx-summary-row"><span>Experience</span><strong>${getSelectedExperienceTitle()}</strong></div>
      <div class="tx-summary-row"><span>Date</span><strong>${formatDisplayDate(bookingState.values.date)}</strong></div>
      <div class="tx-summary-row"><span>Time</span><strong>${slot ? `${slot.start} – ${slot.end}` : "Not selected"}</strong></div>
      <div class="tx-summary-row"><span>Booked by</span><strong>${customer.first_name || ""} ${customer.last_name || ""}</strong></div>
      <div style="margin-top:12px;">${renderSummaryRows()}</div>

      <div class="tx-inline-note" style="margin-top:16px;">
        Final pricing and live availability are confirmed when checkout starts.
      </div>
    </div>
  `;
}

function renderMainStepContent() {
  if (bookingState.step === 1) return renderStepOne();
  if (bookingState.step === 2) return renderStepTwo();
  if (bookingState.step === 3) return renderStepThree();
  if (bookingState.step === 4) return renderStepFour();
  if (bookingState.step === 5) return renderStepFive();
  return renderStepSix();
}

function renderSidePanel() {
  const side = bookingState.modal.querySelector("#tx-booking-side");
  const pricing = computeLocalPricingSnapshot();
  const slot = bookingState.selectedSlot;

  side.innerHTML = `
    <div class="tx-side-block">
      <h4 class="tx-side-title">Your booking</h4>
      <div class="tx-kv"><span>Experience</span><strong>${getSelectedExperienceTitle()}</strong></div>
      <div class="tx-kv"><span>Throwers</span><strong>${bookingState.values.throwers || 0}</strong></div>
      <div class="tx-kv"><span>Date</span><strong>${formatDisplayDate(bookingState.values.date)}</strong></div>
      <div class="tx-kv"><span>Time</span><strong>${slot ? `${slot.start} – ${slot.end}` : "Not selected"}</strong></div>
    </div>

    <div class="tx-side-block">
      <h4 class="tx-side-title">Status</h4>
      <div class="tx-status-chip">
        ${
          bookingState.availabilityLoading
            ? "Loading availability"
            : slot
              ? "Time selected"
              : "Awaiting time selection"
        }
      </div>
      <div class="tx-inline-note" style="margin-top:12px;">
        Your time is held while you complete booking. Final availability is confirmed at checkout.
      </div>
    </div>

    <div class="tx-side-block">
      <h4 class="tx-side-title">Estimated total</h4>
      <div class="tx-kv"><span>Base</span><strong>${formatMoney(pricing.basePrice)}</strong></div>
      <div class="tx-kv"><span>Add-ons</span><strong>${formatMoney(pricing.addonsSubtotal)}</strong></div>
      <div class="tx-kv"><span>Tax</span><strong>${formatMoney(pricing.tax)}</strong></div>
      <div class="tx-kv"><span>Total</span><strong>${formatMoney(pricing.total)}</strong></div>
      <div class="tx-inline-note" style="margin-top:12px;">
        Final pricing is confirmed at checkout.
      </div>
    </div>
  `;
}

function renderMainPanel() {
  const main = bookingState.modal.querySelector("#tx-booking-main");

  main.innerHTML = `
    ${renderStepPills()}
    ${renderMainStepContent()}
    <div class="tx-actions">
      <div class="tx-inline-note">
        ${
          bookingState.step < 6
            ? `Step ${bookingState.step} of 6`
            : "Ready to create booking and redirect to checkout"
        }
      </div>

      <div class="tx-btn-row">
        ${bookingState.step > 1 ? `<button type="button" class="tx-btn" id="tx-prev-step">Back</button>` : ""}
        ${
          bookingState.step < 6
            ? `<button type="button" class="tx-btn tx-btn-primary" id="tx-next-step" ${stepIsValid(bookingState.step) ? "" : "disabled"}>${getNextStepLabel()}</button>`
            : `<button type="button" class="tx-btn tx-btn-primary" id="tx-submit-booking" ${stepIsValid(6) && !bookingState.isSubmitting ? "" : "disabled"}>
                ${bookingState.isSubmitting ? "Starting Checkout..." : "Continue to Checkout"}
               </button>`
        }
      </div>
    </div>
  `;
}

function renderBookingFlow() {
  if (!bookingState.modal) return;
  renderMainPanel();
  renderSidePanel();
  attachMainPanelEvents();
}

function attachMainPanelEvents() {
  const main = bookingState.modal.querySelector("#tx-booking-main");

  main.querySelectorAll("[data-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      bookingState.values.experience = button.getAttribute("data-experience") || "axe_throwing";
      renderBookingFlow();
    });
  });

  main.querySelectorAll("[data-throwers-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = normalizeIntegerInput(button.getAttribute("data-throwers-preset"), 1);
      bookingState.values.throwers = Math.max(1, Math.min(PUBLIC_MAX_PARTY_SIZE, preset));
      bookingState.selectedSlot = null;
      bookingState.availability = [];
      renderBookingFlow();
    });
  });

  const throwersInput = main.querySelector("#tx-throwers");
  if (throwersInput) {
    throwersInput.addEventListener("input", (event) => {
      const value = normalizeIntegerInput(event.target.value, 1);
      bookingState.values.throwers = Math.max(1, Math.min(PUBLIC_MAX_PARTY_SIZE, value));
      bookingState.selectedSlot = null;
      bookingState.availability = [];
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  }

  const dateInput = main.querySelector("#tx-date");
  if (dateInput) {
    dateInput.addEventListener("input", (event) => {
      bookingState.values.date = event.target.value;
      bookingState.selectedSlot = null;
      bookingState.availability = [];
      renderBookingFlow();
    });

    dateInput.addEventListener("click", (event) => {
      if (typeof event.target.showPicker === "function") {
        event.target.showPicker();
      }
    });
  }

  const loadAvailabilityBtn = main.querySelector("#tx-load-availability");
  if (loadAvailabilityBtn) {
    loadAvailabilityBtn.addEventListener("click", async () => {
      await loadAvailability();
      if (bookingState.availability.length) {
        bookingState.step = 3;
        renderBookingFlow();
      }
    });
  }

  main.querySelectorAll("[data-slot-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const slotId = button.getAttribute("data-slot-id");
      const slot = bookingState.availability.find((item) => item.time_block_id === slotId);
      if (!slot || slot.state === "full") return;
      bookingState.selectedSlot = slot;
      renderBookingFlow();
    });
  });

  main.querySelectorAll("[data-addon-key]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const key = event.target.getAttribute("data-addon-key");
      if (!key) return;
      bookingState.values.addons[key] = normalizeIntegerInput(event.target.value, 0);
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  });

  const firstName = main.querySelector("#tx-first-name");
  if (firstName) {
    firstName.addEventListener("input", (event) => {
      bookingState.values.customer.first_name = event.target.value;
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  }

  const lastName = main.querySelector("#tx-last-name");
  if (lastName) {
    lastName.addEventListener("input", (event) => {
      bookingState.values.customer.last_name = event.target.value;
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  }

  const email = main.querySelector("#tx-email");
  if (email) {
    email.addEventListener("input", (event) => {
      bookingState.values.customer.email = event.target.value;
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  }

  const phone = main.querySelector("#tx-phone");
  if (phone) {
    phone.addEventListener("input", (event) => {
      bookingState.values.customer.phone = event.target.value;
      renderSidePanel();
      updateCurrentStepButtonState();
    });
  }

  const birthDate = main.querySelector("#tx-birth-date");
  if (birthDate) {
    birthDate.addEventListener("input", (event) => {
      bookingState.values.customer.birth_date = event.target.value;
      updateCurrentStepButtonState();
    });

    birthDate.addEventListener("click", (event) => {
      if (typeof event.target.showPicker === "function") {
        event.target.showPicker();
      }
    });
  }

  const isMinor = main.querySelector("#tx-is-minor");
  if (isMinor) {
    isMinor.addEventListener("change", (event) => {
      bookingState.values.customer.is_minor = Boolean(event.target.checked);
      updateCurrentStepButtonState();
    });
  }

  const notes = main.querySelector("#tx-customer-notes");
  if (notes) {
    notes.addEventListener("input", (event) => {
      bookingState.values.customer.notes = event.target.value;
      updateCurrentStepButtonState();
    });
  }

  const marketingOptIn = main.querySelector("#tx-marketing-opt-in");
  if (marketingOptIn) {
    marketingOptIn.addEventListener("change", (event) => {
      bookingState.values.customer.marketing_opt_in = Boolean(event.target.checked);
      updateCurrentStepButtonState();
    });
  }

  const prevBtn = main.querySelector("#tx-prev-step");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      setBookingStep(bookingState.step - 1);
    });
  }

  const nextBtn = main.querySelector("#tx-next-step");
  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      if (bookingState.step === 2 && !bookingState.availability.length) {
        await loadAvailability();
      }
      if (stepIsValid(bookingState.step)) {
        setBookingStep(bookingState.step + 1);
      } else if (bookingState.step === 4) {
        renderBookingFlow();
      }
    });
  }

  const submitBtn = main.querySelector("#tx-submit-booking");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitBooking);
  }
}

function wireBookingButtons() {
  const selectors = [
    ".js-start-booking",
    ".btn-primary",
    ".hero-cta",
    ".booking-cta"
  ];

  const seen = new WeakSet();

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (seen.has(el)) return;

      const text = (el.textContent || "").toLowerCase();
      const isBookingTrigger =
        el.classList.contains("js-start-booking") ||
        text.includes("book") ||
        text.includes("start booking");

      if (!isBookingTrigger) return;

      el.addEventListener("click", (event) => {
        event.preventDefault();

        const experience = el.getAttribute("data-experience");
        if (experience) {
          bookingState.values.experience = experience;
        }

        openBookingModal();
      });

      seen.add(el);
    });
  });
}

export function initBooking() {
  createBookingModal();
  wireBookingButtons();
}

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
    "Party & Date",
    "Time",
    "Details",
    "Add-ons",
    "Review"
  ];
}

function getExperienceOptions() {
  return [
    {
      key: "axe_throwing",
      title: "Axe Throwing",
      copy: "First-timers, date nights, birthdays, and repeat throwers."
    },
    {
      key: "axe_throwing_plus",
      title: "Axe Throwing + Add-ons",
      copy: "Book your lane, then enhance it with BYOB, WKTL knives, and specialty throws."
    },
    {
      key: "large_group",
      title: "Large Group / Event",
      copy: "Best for team outings, parties, and bigger bookings up to the public online limit."
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
      padding: 24px;
      background: rgba(4, 8, 18, 0.72);
      backdrop-filter: blur(10px);
    }

    .tx-booking-overlay.is-open {
      display: flex;
    }

    .tx-booking-modal {
      width: min(1040px, 100%);
      max-height: calc(100vh - 40px);
      overflow: auto;
      border-radius: 28px;
      color: #f5f7fb;
      background:
        radial-gradient(circle at top left, rgba(92, 125, 255, 0.16), transparent 28%),
        radial-gradient(circle at bottom right, rgba(255, 122, 89, 0.16), transparent 26%),
        linear-gradient(180deg, rgba(12, 18, 36, 0.98), rgba(10, 14, 28, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
    }

    .tx-booking-shell {
      padding: 26px;
    }

    .tx-booking-top {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 20px;
    }

    .tx-booking-title {
      margin: 0;
      font-size: clamp(1.6rem, 2.8vw, 2.4rem);
      letter-spacing: -0.03em;
    }

    .tx-booking-subtitle {
      margin: 8px 0 0;
      color: rgba(255,255,255,0.74);
      max-width: 62ch;
      line-height: 1.5;
    }

    .tx-booking-close {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: #fff;
      border-radius: 999px;
      width: 42px;
      height: 42px;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .tx-booking-layout {
      display: grid;
      grid-template-columns: 1.5fr 0.9fr;
      gap: 22px;
    }

    .tx-booking-main,
    .tx-booking-side {
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.05);
      border-radius: 22px;
      padding: 22px;
    }

    .tx-steps {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }

    .tx-step-pill {
      border-radius: 14px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      min-height: 64px;
    }

    .tx-step-pill.is-active {
      background: rgba(255,122,89,0.12);
      border-color: rgba(255,122,89,0.42);
      box-shadow: inset 0 0 0 1px rgba(255,122,89,0.16);
    }

    .tx-step-number {
      font-size: 0.76rem;
      color: rgba(255,255,255,0.58);
      margin-bottom: 6px;
    }

    .tx-step-label {
      font-size: 0.92rem;
      line-height: 1.3;
      font-weight: 700;
    }

    .tx-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }

    .tx-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .tx-card-choice,
    .tx-slot-card {
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.04);
      border-radius: 18px;
      padding: 16px;
      cursor: pointer;
      transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
    }

    .tx-card-choice:hover,
    .tx-slot-card:hover {
      transform: translateY(-1px);
      border-color: rgba(255,122,89,0.34);
      background: rgba(255,255,255,0.06);
    }

    .tx-card-choice.is-selected,
    .tx-slot-card.is-selected {
      border-color: rgba(255,122,89,0.54);
      background: rgba(255,122,89,0.12);
      box-shadow: inset 0 0 0 1px rgba(255,122,89,0.18);
    }

    .tx-card-choice.is-disabled,
    .tx-slot-card.is-disabled {
      opacity: 0.48;
      cursor: not-allowed;
      pointer-events: none;
    }

    .tx-card-title {
      font-size: 1.02rem;
      font-weight: 800;
      margin: 0 0 6px;
    }

    .tx-card-copy {
      margin: 0;
      color: rgba(255,255,255,0.72);
      line-height: 1.45;
      font-size: 0.95rem;
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
      font-weight: 700;
      color: rgba(255,255,255,0.84);
    }

    .tx-input,
    .tx-select,
    .tx-textarea {
      width: 100%;
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(8, 12, 22, 0.82);
      color: #fff;
      border-radius: 14px;
      padding: 13px 14px;
      font: inherit;
      box-sizing: border-box;
    }

    .tx-input[type="date"] {
      appearance: none;
      -webkit-appearance: none;
      min-height: 52px;
      cursor: pointer;
    }

    .tx-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.78;
      cursor: pointer;
    }

    .tx-textarea {
      min-height: 96px;
      resize: vertical;
    }

    .tx-inline-note,
    .tx-error,
    .tx-muted {
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .tx-inline-note,
    .tx-muted {
      color: rgba(255,255,255,0.68);
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
      gap: 12px;
    }

    .tx-slot-time {
      font-size: 1rem;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .tx-slot-meta {
      color: rgba(255,255,255,0.7);
      font-size: 0.9rem;
      line-height: 1.35;
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
      font-weight: 700;
      color: rgba(255,255,255,0.84);
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
      font-weight: 700;
    }

    .tx-addon-meta {
      color: rgba(255,255,255,0.68);
      font-size: 0.9rem;
    }

    .tx-addon-sell {
      color: rgba(255,255,255,0.9);
      font-size: 0.9rem;
      line-height: 1.45;
      margin-top: 2px;
    }

    .tx-qty {
      width: 92px;
      flex-shrink: 0;
    }

    .tx-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-top: 20px;
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
      color: #fff;
      border-radius: 14px;
      padding: 13px 18px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease, border-color 160ms ease;
    }

    .tx-btn:hover {
      transform: translateY(-1px);
    }

    .tx-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .tx-btn-primary {
      background: linear-gradient(135deg, rgba(255,122,89,0.96), rgba(234,94,73,0.96));
      border-color: rgba(255,122,89,0.42);
      box-shadow: 0 14px 30px rgba(255,122,89,0.18);
    }

    .tx-side-block + .tx-side-block {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }

    .tx-side-title {
      margin: 0 0 12px;
      font-size: 1rem;
      font-weight: 800;
    }

    .tx-kv {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 0;
      color: rgba(255,255,255,0.78);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .tx-kv strong {
      color: #fff;
      text-align: right;
    }

    .tx-checkbox {
      display: flex;
      align-items: start;
      gap: 10px;
      color: rgba(255,255,255,0.78);
      line-height: 1.45;
      font-size: 0.93rem;
    }

    .tx-empty {
      border-radius: 16px;
      padding: 18px;
      background: rgba(255,255,255,0.04);
      border: 1px dashed rgba(255,255,255,0.14);
      color: rgba(255,255,255,0.68);
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
      .tx-grid-2 {
        grid-template-columns: 1fr;
      }

      .tx-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .tx-btn-row {
        justify-content: flex-end;
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
              Choose what you are booking, select a live time, personalize the visit, and continue to checkout.
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

function updateCurrentStepButtonState() {
  if (!bookingState.modal) return;
  const nextBtn = bookingState.modal.querySelector("#tx-next-step");
  const submitBtn = bookingState.modal.querySelector("#tx-submit-booking");

  if (nextBtn) {
    nextBtn.disabled = !stepIsValid(bookingState.step);
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

    const response = await fetch(`${BOOKING_API_BASE}/availability?${params.toString()}`, {
      method: "GET"
    });

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
    return "Choose your party size and date to load live times.";
  }

  if (bookingState.availabilityLoading) {
    return "Loading live availability…";
  }

  if (!bookingState.availability.length) {
    return "No online times are currently available for that date and party size. Try another date.";
  }

  return "Select a live time below. These slots reflect backend booking availability.";
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
        ? "Customer selected Large Group / Event path from Tex Axes public booking flow."
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
      <h3 class="tx-card-title" style="margin-bottom:14px;">What are you booking?</h3>
      <div class="tx-grid-3">
        ${options
          .map((option) => {
            const selected = bookingState.values.experience === option.key ? "is-selected" : "";
            return `
              <button
                type="button"
                class="tx-card-choice ${selected}"
                data-experience="${option.key}"
              >
                <div class="tx-card-title">${option.title}</div>
                <p class="tx-card-copy">${option.copy}</p>
              </button>
            `;
          })
          .join("")}
      </div>

      <div class="tx-inline-note" style="margin-top:16px;">
        Online booking is for public sessions up to 24 throwers. Larger or custom events can be routed into a higher-touch path next.
      </div>
    </div>
  `;
}

function renderStepTwo() {
  return `
    <div>
      <h3 class="tx-card-title" style="margin-bottom:14px;">How many are throwing, and what day do you want?</h3>

      <div class="tx-grid-2">
        <div class="tx-field">
          <label class="tx-label" for="tx-throwers">Number of throwers</label>
          <input
            id="tx-throwers"
            class="tx-input"
            type="number"
            min="1"
            max="${PUBLIC_MAX_PARTY_SIZE}"
            value="${bookingState.values.throwers}"
          />
          <div class="tx-inline-note">Public online booking currently supports up to 24 throwers.</div>
        </div>

        <div class="tx-field">
          <label class="tx-label" for="tx-date">Select date</label>
          <input
            id="tx-date"
            class="tx-input"
            type="date"
            min="${getTodayLocalDate()}"
            value="${bookingState.values.date}"
          />
          <div class="tx-inline-note">Use the calendar picker to choose your date. Live times load from that selection.</div>
        </div>
      </div>

      <button type="button" class="tx-btn tx-btn-primary" id="tx-load-availability">
        ${bookingState.availabilityLoading ? "Loading..." : "Show Available Times"}
      </button>
    </div>
  `;
}

function renderStepThree() {
  const slots = bookingState.availability || [];
  const hint = getAvailabilityHint();

  return `
    <div>
      <h3 class="tx-card-title" style="margin-bottom:14px;">Choose a live time</h3>
      <div class="tx-inline-note" style="margin-bottom:16px;">${hint}</div>

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
      <h3 class="tx-card-title" style="margin-bottom:14px;">Who is booking?</h3>

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
        <textarea id="tx-customer-notes" class="tx-textarea">${customer.notes}</textarea>
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
      <h3 class="tx-card-title" style="margin-bottom:14px;">Enhance your experience</h3>
      <div class="tx-inline-note" style="margin-bottom:12px;">
        Your time is already selected. Add-ons below are optional ways to make the visit more memorable.
      </div>

      ${renderAddonRow(
        "byob_guests",
        "BYOB Guests",
        "$5 per guest",
        "Bring your own drinks and make it your night.",
        addons.byob_guests
      )}

      ${renderAddonRow(
        "wktl_knife_rental_qty",
        "WKTL Knife Rental",
        "$20 each",
        "Try certified knife throwing on the same visit.",
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
        "A memorable specialty throw that turns the session into a story.",
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
      <h3 class="tx-card-title" style="margin-bottom:14px;">Review your booking</h3>

      <div class="tx-summary-row"><span>Experience</span><strong>${getSelectedExperienceTitle()}</strong></div>
      <div class="tx-summary-row"><span>Date</span><strong>${bookingState.values.date || "Not selected"}</strong></div>
      <div class="tx-summary-row"><span>Time</span><strong>${slot ? `${slot.start} – ${slot.end}` : "Not selected"}</strong></div>
      <div class="tx-summary-row"><span>Booked by</span><strong>${customer.first_name || ""} ${customer.last_name || ""}</strong></div>
      <div style="margin-top:12px;">${renderSummaryRows()}</div>

      <div class="tx-inline-note" style="margin-top:16px;">
        Final booking admissibility, bay allocation, and payment session creation are all decided by the backend at checkout start.
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
      <h4 class="tx-side-title">Current selection</h4>
      <div class="tx-kv"><span>Experience</span><strong>${getSelectedExperienceTitle()}</strong></div>
      <div class="tx-kv"><span>Throwers</span><strong>${bookingState.values.throwers || 0}</strong></div>
      <div class="tx-kv"><span>Date</span><strong>${bookingState.values.date || "Not selected"}</strong></div>
      <div class="tx-kv"><span>Time</span><strong>${slot ? `${slot.start} – ${slot.end}` : "Not selected"}</strong></div>
    </div>

    <div class="tx-side-block">
      <h4 class="tx-side-title">Live booking status</h4>
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
        Availability and final booking acceptance are enforced by the Tex Axes backend, not by the page itself.
      </div>
    </div>

    <div class="tx-side-block">
      <h4 class="tx-side-title">Estimated total</h4>
      <div class="tx-kv"><span>Base</span><strong>${formatMoney(pricing.basePrice)}</strong></div>
      <div class="tx-kv"><span>Add-ons</span><strong>${formatMoney(pricing.addonsSubtotal)}</strong></div>
      <div class="tx-kv"><span>Tax</span><strong>${formatMoney(pricing.tax)}</strong></div>
      <div class="tx-kv"><span>Total</span><strong>${formatMoney(pricing.total)}</strong></div>
      <div class="tx-inline-note" style="margin-top:12px;">
        Final totals are recomputed by the booking API during checkout creation.
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
            ? `<button type="button" class="tx-btn tx-btn-primary" id="tx-next-step" ${stepIsValid(bookingState.step) ? "" : "disabled"}>Continue</button>`
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
      renderSidePanel();
      updateCurrentStepButtonState();
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

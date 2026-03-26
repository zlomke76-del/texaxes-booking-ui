import { bookingState } from "../state.js";
import { injectStyles } from "./styles.js";

export function createModal() {
  if (bookingState.modal) return;

  injectStyles();

  const el = document.createElement("div");
  el.className = "tx-booking-overlay";

  el.innerHTML = `
    <div class="tx-booking-modal">
      <div id="tx-main"></div>
      <div id="tx-side"></div>
    </div>
  `;

  document.body.appendChild(el);
  bookingState.modal = el;
}

export function openModal() {
  createModal();
  bookingState.modal.style.display = "flex";
}

export function closeModal() {
  bookingState.modal.style.display = "none";
}

import { openModal } from "./ui/modal.js";

export function initBooking() {
  document.querySelectorAll(".booking-cta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });
}

import { bookingState } from "../state.js";

export function getExperienceOptions() {
  return [
    {
      key: "axe_throwing",
      title: "Axe Throwing",
      copy: "Perfect for date nights, birthdays, and first-timers.",
      sell: "✔ Most popular • ✔ Coaching included • ✔ No experience needed"
    },
    {
      key: "large_group",
      title: "Large Group / Event",
      copy: "Best for team outings and bigger events.",
      sell: "✔ Priority support • ✔ Custom coordination • ✔ Best for 8+"
    }
  ];
}

export function renderStepOne() {
  const options = getExperienceOptions();

  return `
    <h3>What are you booking?</h3>
    <div class="tx-grid-2">
      ${options
        .map(
          (o) => `
        <button class="tx-card-choice ${
          bookingState.values.experience === o.key ? "is-selected" : ""
        }" data-experience="${o.key}">
          <div>${o.title}</div>
          <p>${o.copy}</p>
          <div class="tx-card-sell">${o.sell}</div>
        </button>
      `
        )
        .join("")}
    </div>
  `;
}

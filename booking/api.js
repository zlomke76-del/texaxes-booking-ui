import { bookingState } from "./state.js";

const BASE = "https://texaxes-ops.vercel.app";

export async function loadAvailability() {
  bookingState.availabilityLoading = true;
  bookingState.availability = [];

  const params = new URLSearchParams({
    date: bookingState.values.date,
    throwers: String(bookingState.values.throwers)
  });

  const res = await fetch(`${BASE}/availability?${params}`);
  const data = await res.json();

  bookingState.availabilityLoading = false;
  bookingState.availability = data.slots || [];
}

export async function submitBooking(payload) {
  const res = await fetch(`${BASE}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return res.json();
}

import { bookingState } from "./state.js";

export function computePricing() {
  const throwers = Number(bookingState.values.throwers || 0);
  const duration = Number(bookingState.values.duration_hours || 1);
  const addons = bookingState.values.addons;

  const base = throwers * 29 * duration;

  const addonsTotal =
    addons.byob_guests * 5 +
    addons.wktl_knife_rental_qty * 20 +
    addons.pro_axe_qty * 10 +
    addons.big_axe_qty * 15 +
    addons.shovel_qty * 20;

  const subtotal = base + addonsTotal;
  const tax = subtotal * 0.0825;

  return {
    base,
    addonsTotal,
    subtotal,
    tax,
    total: subtotal + tax
  };
}

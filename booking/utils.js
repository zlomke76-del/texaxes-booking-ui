export function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function getTodayLocalDate() {
  const now = new Date();
  const tzOffsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function getInitialBookingDate() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  const tzOffsetMs = next.getTimezoneOffset() * 60000;
  return new Date(next.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export function normalizeIntegerInput(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.floor(n);
}

// Dates are stored as UTC ISO strings and always shown in Korea time.
const kst = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function kstParts(iso: string) {
  const p = Object.fromEntries(
    kst.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return p as Record<"year" | "month" | "day" | "hour" | "minute", string>;
}

/** "2026.08.30" */
export function formatDate(iso: string) {
  const p = kstParts(iso);
  return `${p.year}.${p.month}.${p.day}`;
}

/** "2026-08-30" (Korea date) for <time dateTime>. */
export function isoDate(iso: string) {
  const p = kstParts(iso);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Value for <input type="datetime-local">, in Korea time. */
export function toKstInput(iso: string) {
  const p = kstParts(iso);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Parses a datetime-local value typed in Korea time; null when invalid. */
export function fromKstInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+09:00`);
  if (Number.isNaN(date.getTime())) return null;
  // Date rolls impossible days over (02-31 → 03-03); only round-tripping values are real.
  return toKstInput(date.toISOString()) === value ? date.toISOString() : null;
}

/** "2026.08.31 09:30" (Korea time). */
export const formatDateTime = (iso: string) => `${formatDate(iso)} ${toKstInput(iso).slice(11)}`;

/** Today's date in Korea as "YYYY-MM-DD" (for date-only settings such as popup end dates). */
export const kstToday = () => isoDate(new Date().toISOString());

export function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

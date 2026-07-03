const UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [31536000, "year"],
  [2592000, "month"],
  [604800, "week"],
  [86400, "day"],
  [3600, "hour"],
  [60, "minute"],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 days ago", "last month", "just now". */
export function timeAgo(value: string): string {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  for (const [size, unit] of UNITS) {
    if (seconds >= size) return rtf.format(-Math.round(seconds / size), unit);
  }
  return "just now";
}

export function fullDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Rough reading time from plain-text length. */
export function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

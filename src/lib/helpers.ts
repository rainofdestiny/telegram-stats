import type { ParsedMessage } from "../types";

export const pageSlice = <T>(arr: T[], page: number, size: number) =>
  arr.slice(page * size, (page + 1) * size);

export function reactionsMap(r: unknown): Record<string, number> {
  if (!r) return {};
  if (Array.isArray(r)) {
    const out: Record<string, number> = {};
    for (const it of r) {
      const emoji = (it as any)?.emoji as string | undefined;
      const count = (it as any)?.count as number | undefined;
      if (emoji) out[emoji] = (out[emoji] ?? 0) + (count ?? 0);
    }
    return out;
  }
  return r as Record<string, number>;
}

export const totalReactions = (r?: Record<string, number>): number =>
  Object.values(r ?? {}).reduce((a, b) => a + b, 0);

export function weekStartISO(d: Date): string {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  const yyyy = start.getUTCFullYear();
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isHuman(m: ParsedMessage) {
  const id = m.from_id ?? "";
  if (!m.from || m.from.trim().length === 0) return false;
  if (id.startsWith("channel") || id.startsWith("bot")) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyM = m as any;
  if (anyM.forwarded_from || anyM.saved_from) return false;
  return true;
}

// src/lib/helpers.ts
import type { ParsedMessage } from "../types";

/** Пагинация */
export const pageSlice = <T>(arr: T[], page: number, size: number): T[] =>
  arr.slice(page * size, (page + 1) * size);

/** ===================== РЕАКЦИИ ===================== */
/** Агрегатор ВСЕХ реакций (и unicode-эмодзи, и кастомных) */
export function reactionsMap(r: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!r) return out;

  if (!Array.isArray(r)) {
    for (const [k, v] of Object.entries(r as Record<string, number>)) {
      out[k] = Number(v) || 0;
    }
    return out;
  }

  for (const it of r as any[]) {
    const type = it?.type as string | undefined;
    const count = Number(it?.count) || 0;

    if (type === "emoji" && typeof it?.emoji === "string" && it.emoji.length) {
      out[it.emoji] = (out[it.emoji] ?? 0) + count;
    } else if (type === "custom_emoji") {
      // раньше мы помечали Premium Emoji, теперь оставим для совместимости,
      // но в «классической» версии ниже кастомы будут отсечены
      const base =
        (it?.document_id as string | undefined) ??
        (it?.custom_emoji_id as string | undefined) ??
        "unknown";
      const name = (base.split("/").pop() || base).replace(/\.[^.]+$/, "");
      const key = `Premium Emoji ${name}`;
      out[key] = (out[key] ?? 0) + count;
    }
  }
  return out;
}

/** Только КЛАССИЧЕСКИЕ реакции (unicode-эмодзи). Кастомные исключаются. */
export function reactionsMapClassic(r: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!r) return out;
  if (!Array.isArray(r)) {
    // если вдруг пришёл уже агрегированный объект — отфильтруем только одиночные unicode-ключи
    for (const [k, v] of Object.entries(r as Record<string, number>)) {
      // простой фильтр: emoji-подобная строка (обычно одна «глифовая» метка)
      if (/\p{Emoji}/u.test(k)) out[k] = Number(v) || 0;
    }
    return out;
  }
  for (const it of r as any[]) {
    if (it?.type === "emoji" && typeof it?.emoji === "string" && it.emoji) {
      const count = Number(it?.count) || 0;
      out[it.emoji] = (out[it.emoji] ?? 0) + count;
    }
    // custom_emoji — игнорируем полностью
  }
  return out;
}

/** Сумма всех реакций (unicode+custom) */
export function totalReactions(
  reactions?: Record<string, number> | unknown[],
): number {
  if (!reactions) return 0;
  if (Array.isArray(reactions)) {
    return (reactions as any[]).reduce(
      (s, it) => s + (Number((it as any)?.count) || 0),
      0,
    );
  }
  return Object.values(reactions).reduce((a, b) => a + (Number(b) || 0), 0);
}

/** Сумма ТОЛЬКО классических реакций */
export function totalReactionsClassic(r?: unknown): number {
  const m = reactionsMapClassic(r);
  return Object.values(m).reduce((a, b) => a + (Number(b) || 0), 0);
}

/** ===================== ДАТЫ/НЕДЕЛИ ===================== */
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

/** ===================== ФИЛЬТР ЛЮДЕЙ ===================== */
export function isHuman(m: ParsedMessage): boolean {
  const id = m.from_id ?? "";
  if (!m.from || m.from.trim().length === 0) return false;
  if (id.startsWith("channel") || id.startsWith("bot")) return false;
  // @ts-expect-error телеграм-экспорт
  if (m.forwarded_from || m.saved_from) return false;
  return true;
}

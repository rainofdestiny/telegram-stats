// src/lib/telegram.ts
import type { RawMessage, ParsedMessage, Row, Node, Link } from "../types";
export type { Node, Link } from "../types"; // re-export, чтобы можно было импортировать из lib/telegram

/* --------------------------- helpers: parsing --------------------------- */

function extractTextField(t: any): string {
  if (typeof t === "string") return t;
  if (Array.isArray(t)) {
    return t
      .map((part) => (typeof part === "string" ? part : (part?.text ?? "")))
      .join(" ")
      .trim();
  }
  return "";
}

function normalizeReactions(r: any): Record<string, number> {
  const out: Record<string, number> = {};
  if (Array.isArray(r)) {
    for (const item of r) {
      const emoji =
        item?.emoji ?? item?.emoticon ?? item?.text ?? item?.reaction;
      const count = Number(item?.count ?? 0);
      if (emoji) out[emoji] = (out[emoji] ?? 0) + (isNaN(count) ? 0 : count);
    }
  } else if (r && typeof r === "object") {
    for (const [k, v] of Object.entries(r)) {
      const cnt = Number(v as any);
      out[k] = isNaN(cnt) ? 0 : cnt;
    }
  }
  return out;
}

function toISO(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return new Date(NaN).toISOString();
  }
}

function byDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function getWeekKey(iso: string): string {
  const d = new Date(iso);
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((+tmp - +firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/* ------------------------------ base parse ------------------------------ */

export function parseMessages(messages: RawMessage[]): ParsedMessage[] {
  const res: ParsedMessage[] = [];

  for (const anyMsg of messages as any[]) {
    const m = anyMsg ?? {};
    const type = String(m.type ?? "message").toLowerCase();
    if (type !== "message") continue;

    const from = String(m.from ?? "");
    const from_id = typeof m.from_id === "string" ? m.from_id : undefined;
    const text = extractTextField(m.text);
    const reactions = normalizeReactions(m.reactions);

    const fullDateISO = toISO(String(m.date ?? ""));
    const total = Object.values(reactions).reduce((a, b) => a + (b || 0), 0);

    res.push({
      id: Number(m.id),
      from,
      from_id,
      text,
      date: String(m.date ?? ""),
      reactions,
      reply_to_message_id: m.reply_to_message_id
        ? Number(m.reply_to_message_id)
        : undefined,
      media_type: m.media_type ? String(m.media_type).toLowerCase() : undefined,
      fullDateISO,
      total,
    });
  }

  return res;
}

/* --------------------------- author classification --------------------------- */

export function isHumanAuthor(m: ParsedMessage): boolean {
  return (
    !!m.from_id &&
    m.from_id.startsWith("user") &&
    !m.from.toLowerCase().endsWith("bot")
  );
}

/* ------------------------------- utilities ------------------------------- */

export function uniqueEmojis(messages: ParsedMessage[]): string[] {
  const set = new Set<string>();
  messages.forEach((m) => {
    Object.keys(m.reactions ?? {}).forEach((e) => set.add(e));
  });
  return Array.from(set);
}

function latestNameByUser(messages: ParsedMessage[]): Record<string, string> {
  const last: Record<string, { name: string; iso: string }> = {};
  for (const m of messages) {
    if (!m.from_id || !m.from_id.startsWith("user")) continue;
    const cur = last[m.from_id];
    if (!cur || m.fullDateISO > cur.iso)
      last[m.from_id] = { name: m.from, iso: m.fullDateISO };
  }
  const out: Record<string, string> = {};
  Object.entries(last).forEach(([k, v]) => (out[k] = v.name));
  return out;
}

/* --------------------------------- TOPS --------------------------------- */

export function topMessagesByEmojis(
  messages: ParsedMessage[],
  target: string[] = [],
  limit = 2000,
) {
  const set = new Set(target);
  const scored = messages
    .filter(isHumanAuthor)
    .map((m) => {
      const sum = Object.entries(m.reactions ?? {}).reduce(
        (acc, [emoji, cnt]) => {
          if (set.size === 0 || set.has(emoji)) acc += cnt || 0;
          return acc;
        },
        0,
      );
      return { ...m, total: sum };
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  return scored;
}

export function topAuthorsByCount(messages: ParsedMessage[], limit = 2000) {
  const nameByUser = latestNameByUser(messages);
  const counts: Record<string, number> = {};
  messages.filter(isHumanAuthor).forEach((m) => {
    const k = m.from_id!;
    counts[k] = (counts[k] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([id, count]) => ({ id, name: nameByUser[id] ?? id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* ------------------------------ activity ------------------------------ */

export function dailyHistogram(
  messages: ParsedMessage[],
): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  messages.forEach((m) => {
    const k = byDateKey(m.fullDateISO);
    map[k] = (map[k] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function weeklyHistogram(
  messages: ParsedMessage[],
): { date: string; value: number }[] {
  const map: Record<string, number> = {};
  messages.forEach((m) => {
    const wk = getWeekKey(m.fullDateISO);
    map[wk] = (map[wk] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function hourWeekdayHeatmap(
  messages: ParsedMessage[],
): { weekday: number; hour: number; count: number }[] {
  const map: Record<string, number> = {};
  messages.forEach((m) => {
    const d = new Date(m.fullDateISO);
    const weekday = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    const key = `${weekday}-${hour}`;
    map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map).map(([k, count]) => {
    const [weekday, hour] = k.split("-").map((x) => Number(x));
    return { weekday, hour, count };
  });
}

/* ------------------------------- content ------------------------------- */

export function wordFrequency(messages: ParsedMessage[], topN = 50) {
  const counts: Record<string, number> = {};
  for (const m of messages) {
    const t = (m.text ?? "").toString().toLowerCase();
    for (const w of t.split(/[^a-zа-яё0-9_]+/i).filter(Boolean)) {
      counts[w] = (counts[w] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export function mediaStats(raw: RawMessage[]) {
  const acc = {
    text: 0,
    stickers: 0,
    photos: 0,
    videos: 0,
    voice: 0,
    other: 0,
  };
  for (const anyMsg of raw as any[]) {
    const t = String(anyMsg?.media_type ?? "").toLowerCase();
    if (!t) {
      acc.text++;
      continue;
    }
    if (t.includes("sticker")) acc.stickers++;
    else if (t.includes("photo") || t.includes("image")) acc.photos++;
    else if (t.includes("video")) acc.videos++;
    else if (t.includes("voice") || t.includes("audio")) acc.voice++;
    else acc.other++;
  }
  return acc;
}

export function longestMessages(messages: ParsedMessage[], n = 10) {
  return [...messages]
    .filter(isHumanAuthor)
    .map((m) => ({
      id: m.id,
      from: m.from,
      text: m.text ?? "",
      length: (m.text ?? "").length,
    }))
    .sort((a, b) => b.length - a.length)
    .slice(0, n);
}

/* ------------------------------- reactions ------------------------------- */

export function topMessagesByReactions(
  messages: ParsedMessage[],
  limit = 10000,
  target: string[] = [],
) {
  const set = new Set(target);
  const scored = messages
    .filter(isHumanAuthor)
    .map((m) => {
      const sum = Object.entries(m.reactions ?? {}).reduce(
        (acc, [emoji, cnt]) => {
          if (set.size === 0 || set.has(emoji)) acc += cnt || 0;
          return acc;
        },
        0,
      );
      return { ...m, total: sum };
    })
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
  return scored;
}

export function topAuthorsByReactions(
  messages: ParsedMessage[],
  limit = 20,
  target: string[] = [],
) {
  const set = new Set(target);
  const counts: Record<string, number> = {};
  const nameByUser = latestNameByUser(messages);

  messages.filter(isHumanAuthor).forEach((m) => {
    const add = Object.entries(m.reactions ?? {}).reduce(
      (acc, [emoji, cnt]) => {
        if (set.size === 0 || set.has(emoji)) acc += cnt || 0;
        return acc;
      },
      0,
    );
    if (add > 0) {
      const k = m.from_id!;
      counts[k] = (counts[k] ?? 0) + add;
    }
  });

  return Object.entries(counts)
    .map(([id, reactions]) => ({ from: nameByUser[id] ?? id, reactions }))
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, limit);
}

export function reactionsDailyHistogram(messages: ParsedMessage[]) {
  const map: Record<string, number> = {};
  messages.forEach((m) => {
    const sum = Object.values(m.reactions ?? {}).reduce(
      (a, b) => a + (b || 0),
      0,
    );
    const k = byDateKey(m.fullDateISO);
    map[k] = (map[k] ?? 0) + sum;
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function topEmojis(messages: ParsedMessage[], n = 20) {
  const counts: Record<string, number> = {};
  messages.forEach((m) => {
    Object.entries(m.reactions ?? {}).forEach(([emoji, cnt]) => {
      counts[emoji] = (counts[emoji] ?? 0) + (cnt || 0);
    });
  });
  return Object.entries(counts)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/* ------------------------------- social ------------------------------- */

export function weeklyActiveAuthors(messages: ParsedMessage[]) {
  const setByWeek: Record<string, Set<string>> = {};
  messages.filter(isHumanAuthor).forEach((m) => {
    const wk = getWeekKey(m.fullDateISO);
    const uid = m.from_id!;
    (setByWeek[wk] ??= new Set()).add(uid);
  });
  return Object.entries(setByWeek)
    .map(([date, s]) => ({ date, value: s.size }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function weeklyNewAuthors(messages: ParsedMessage[]) {
  const firstWeekByUser: Record<string, string> = {};
  messages.filter(isHumanAuthor).forEach((m) => {
    const uid = m.from_id!;
    const wk = getWeekKey(m.fullDateISO);
    if (!firstWeekByUser[uid] || wk < firstWeekByUser[uid])
      firstWeekByUser[uid] = wk;
  });
  const counts: Record<string, number> = {};
  Object.values(firstWeekByUser).forEach(
    (wk) => (counts[wk] = (counts[wk] ?? 0) + 1),
  );
  return Object.entries(counts)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function stableAuthors(messages: ParsedMessage[], limit = 20) {
  const weeksByUser: Record<string, Set<string>> = {};
  messages.filter(isHumanAuthor).forEach((m) => {
    const uid = m.from_id!;
    const wk = getWeekKey(m.fullDateISO);
    (weeksByUser[uid] ??= new Set()).add(wk);
  });
  const nameByUser = latestNameByUser(messages);
  return Object.entries(weeksByUser)
    .map(([id, set]) => ({ name: nameByUser[id] ?? id, weeks: set.size }))
    .sort((a, b) => b.weeks - a.weeks)
    .slice(0, limit);
}

/* ----------------------------- reply graph ----------------------------- */

export function buildReplyGraph(messages: ParsedMessage[]) {
  if (!messages || messages.length === 0) return { nodes: [], links: [] };

  const human = messages.filter(isHumanAuthor);
  const byId: Record<number, ParsedMessage> = {};
  human.forEach((m) => (byId[m.id] = m));

  const nameByUser = latestNameByUser(human);

  const nodesMap: Record<string, Node> = {};
  const linksMap: Record<string, number> = {};

  for (const m of human) {
    const uid = m.from_id!;
    if (!nodesMap[uid])
      nodesMap[uid] = { id: uid, name: nameByUser[uid] ?? m.from };

    if (m.reply_to_message_id) {
      const target = byId[m.reply_to_message_id];
      if (!target || !isHumanAuthor(target)) continue;
      const tid = target.from_id!;
      if (!nodesMap[tid])
        nodesMap[tid] = { id: tid, name: nameByUser[tid] ?? target.from };

      const key = `${uid}->${tid}`;
      linksMap[key] = (linksMap[key] ?? 0) + 1;
    }
  }

  const nodes: Node[] = Object.values(nodesMap);
  const links: Link[] = Object.entries(linksMap).map(([k, value]) => {
    const [source, target] = k.split("->");
    return { source, target, value };
  });
  return { nodes, links };
}

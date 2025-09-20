// src/lib/telegram.ts
import { RawMessage, ParsedMessage, Row, Node, Link } from "../types";

/* ======================= helpers ======================= */

const BOT_SUFFIXES = ["bot", "бот"];

function looksLikeBot(name?: string): boolean {
  if (!name) return false;
  const s = String(name).trim().toLowerCase();
  return BOT_SUFFIXES.some((suf) => s.endsWith(suf));
}

function isUserId(id?: string): boolean {
  return !!id && id.startsWith("user");
}

function isChannelId(id?: string): boolean {
  return !!id && id.startsWith("channel");
}

function isForwarded(raw: any): boolean {
  return !!(raw?.forwarded_from || raw?.saved_from);
}

function isService(raw: any): boolean {
  return raw?.type !== "message";
}

function normalizeText(text: any): string {
  if (typeof text === "string") return text.trim();
  if (Array.isArray(text)) {
    return text
      .map((t) => (typeof t === "string" ? t : (t?.text ?? "")))
      .join("")
      .trim();
  }
  return "";
}

function normalizeReactions(raw: any): Record<string, number> {
  const r = raw?.reactions;
  if (!r) return {};
  if (Array.isArray(r)) {
    // Telegram Desktop export: [{ emoji, count, ... }]
    const acc: Record<string, number> = {};
    for (const item of r) {
      const e = item?.emoji;
      const c = Number(item?.count ?? 0);
      if (e) acc[e] = (acc[e] ?? 0) + c;
    }
    return acc;
  }
  // already Record<string, number>
  if (typeof r === "object") return { ...(r as Record<string, number>) };
  return {};
}

/** Глобальный предикат допуска сообщения (по raw) */
function allowRawMessage(raw: any): boolean {
  if (isService(raw)) return false; // только type==="message"
  if (isForwarded(raw)) return false; // без пересланных
  const fromId: string | undefined = raw?.from_id;
  const fromName: string | undefined = raw?.from;
  // только люди: user…; любое channel… — вон
  if (!isUserId(fromId)) return false;
  // боты по нику
  if (looksLikeBot(fromName)) return false;
  return true;
}

/* ======================= core ======================= */

export function parseMessages(messages: RawMessage[]): ParsedMessage[] {
  // Пропускаем только валидные человеческие сообщения
  const filtered = (messages as any[]).filter(allowRawMessage);

  // Для актуального имени по user_id соберём последнюю метку времени
  const latestNameByUser: Record<string, { name: string; iso: string }> = {};

  const parsed: ParsedMessage[] = filtered.map((m: any) => {
    const text = normalizeText(m.text);
    const reactions = normalizeReactions(m);
    const fullDateISO = new Date(m.date).toISOString();
    const total = Object.values(reactions).reduce((a, b) => a + b, 0);

    const pm: ParsedMessage = {
      id: Number(m.id),
      from: typeof m.from === "string" ? m.from : "",
      from_id: m.from_id,
      text,
      date: m.date,
      reactions,
      reply_to_message_id: m.reply_to_message_id,
      media_type: m.media_type,
      fullDateISO,
      total,
    };

    // Обновим последнее имя по user_id
    const uid = pm.from_id!;
    const rec = latestNameByUser[uid];
    if (!rec || fullDateISO > rec.iso) {
      latestNameByUser[uid] = { name: pm.from, iso: fullDateISO };
    }

    return pm;
  });

  // Подставим актуальные имена туда, где пусто или устарело
  for (const msg of parsed) {
    const uid = msg.from_id!;
    const rec = latestNameByUser[uid];
    if (rec && rec.name && msg.from !== rec.name) {
      msg.from = rec.name;
    }
  }

  return parsed;
}

/** Проверка уже на ParsedMessage, лишнее не пройдёт после parseMessages */
export function isHumanAuthor(m: ParsedMessage): boolean {
  if (!isUserId(m.from_id)) return false;
  if (looksLikeBot(m.from)) return false;
  return true;
}

/* ======================= tops ======================= */

export function buildTopAuthors(messages: ParsedMessage[], limit = 10): Row[] {
  const countsByUser: Record<string, number> = {};
  const latestNameByUser: Record<string, { name: string; iso: string }> = {};

  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const uid = m.from_id!;
    countsByUser[uid] = (countsByUser[uid] ?? 0) + 1;
    const rec = latestNameByUser[uid];
    if (!rec || m.fullDateISO > rec.iso) {
      latestNameByUser[uid] = { name: m.from, iso: m.fullDateISO };
    }
  }

  return Object.entries(countsByUser)
    .map(([uid, count]) => ({
      uid,
      from: latestNameByUser[uid]?.name || "",
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((e, idx) => ({ rank: idx + 1, from: e.from, count: e.count }));
}

export function buildTopMessages(messages: ParsedMessage[], limit = 10): Row[] {
  const rows = messages
    .filter(isHumanAuthor)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((m, idx) => ({
      rank: idx + 1,
      from: m.from,
      text: m.text || "(без текста)",
      reactions: m.total,
    }));
  return rows;
}

export function buildTopAuthorsByReactions(
  messages: ParsedMessage[],
  limit = 20,
): Row[] {
  const sumByUser: Record<string, number> = {};
  const latestNameByUser: Record<string, { name: string; iso: string }> = {};

  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const uid = m.from_id!;
    sumByUser[uid] = (sumByUser[uid] ?? 0) + m.total;
    const rec = latestNameByUser[uid];
    if (!rec || m.fullDateISO > rec.iso) {
      latestNameByUser[uid] = { name: m.from, iso: m.fullDateISO };
    }
  }

  return Object.entries(sumByUser)
    .map(([uid, total]) => ({
      uid,
      from: latestNameByUser[uid]?.name || "",
      reactions: total,
    }))
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, limit)
    .map((e, idx) => ({ rank: idx + 1, from: e.from, reactions: e.reactions }));
}

/* ======================= activity ======================= */

export function buildHourWeekdayHeatmap(messages: ParsedMessage[]) {
  const heat: { weekday: number; hour: number; count: number }[] = [];

  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const d = new Date(m.fullDateISO);
    const weekday = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
    const hour = d.getHours();
    const found = heat.find((h) => h.weekday === weekday && h.hour === hour);
    if (found) found.count++;
    else heat.push({ weekday, hour, count: 1 });
  }

  return heat;
}

export function buildDailyChart(messages: ParsedMessage[]) {
  const counts: Record<string, number> = {};
  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const date = m.fullDateISO.slice(0, 10);
    counts[date] = (counts[date] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function buildWeeklyTrend(messages: ParsedMessage[]) {
  const counts: Record<string, number> = {};
  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const d = new Date(m.fullDateISO);
    const y = d.getFullYear();
    const w = getWeekNumber(d);
    const key = `${y}-W${w.toString().padStart(2, "0")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => (a.week > b.week ? 1 : -1));
}

function getWeekNumber(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((+d - +oneJan) / dayMs);
  return Math.ceil((d.getDay() + 1 + days) / 7);
}

/* ======================= reply graph ======================= */

export function buildReplyGraph(messages: ParsedMessage[]): {
  nodes: Node[];
  links: Link[];
} {
  // Соберём индекс по id, только по людям
  const byId: Record<number, ParsedMessage> = {};
  const latestNameByUser: Record<string, { name: string; iso: string }> = {};
  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    byId[m.id] = m;
    const uid = m.from_id!;
    const rec = latestNameByUser[uid];
    if (!rec || m.fullDateISO > rec.iso) {
      latestNameByUser[uid] = { name: m.from, iso: m.fullDateISO };
    }
  }

  const nodeSeen = new Set<string>();
  const nodes: Node[] = [];
  const linkWeights: Record<string, number> = {};

  for (const m of messages) {
    if (!isHumanAuthor(m)) continue;
    const src = m.from_id!;
    if (!nodeSeen.has(src)) {
      nodes.push({ id: src, name: latestNameByUser[src]?.name || "" });
      nodeSeen.add(src);
    }

    const replyTo = m.reply_to_message_id;
    if (!replyTo) continue;

    const target = byId[replyTo];
    if (!target) continue;
    const dst = target.from_id!;
    if (src === dst) continue;

    const key = `${src}→${dst}`;
    linkWeights[key] = (linkWeights[key] ?? 0) + 1;
  }

  const links: Link[] = Object.entries(linkWeights).map(([k, value]) => {
    const [source, target] = k.split("→");
    return { source, target, value };
  });

  return { nodes, links };
}

/* ======================= guards (не используются снаружи) ======================= */

function _debugSkipReason(raw: any): string | null {
  if (isService(raw)) return "not-message";
  if (isForwarded(raw)) return "forwarded";
  if (isChannelId(raw?.from_id)) return "channel";
  if (!isUserId(raw?.from_id)) return "not-user";
  if (looksLikeBot(raw?.from)) return "bot";
  return null;
}

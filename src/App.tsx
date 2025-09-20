import React, { useMemo, useState } from "react";

import FileDrop from "./components/FileDrop";
import Tabs from "./components/Tabs";

// Activity
import TopDaysTable from "./components/activity/TopDaysTable";
import WeeklyTrend from "./components/activity/WeeklyTrend";
import HourWeekdayHeatmap from "./components/activity/HourWeekdayHeatmap";
import DailyChart from "./components/DailyChart";

// Content
import TopWordsTable from "./components/content/TopWordsTable";
import MediaStatsTable from "./components/content/MediaStatsTable";
import LongestMessagesTable from "./components/content/LongestMessagesTable";

// Reactions
import ReactionsChart from "./components/reactions/ReactionsChart";
import TopEmojisTable from "./components/reactions/TopEmojisTable";
import TopReactionMessagesTable from "./components/reactions/TopReactionMessagesTable";
import TopReactionAuthorsTable from "./components/reactions/TopReactionAuthorsTable";

// Social
import WeeklyActiveAuthorsChart from "./components/social/WeeklyActiveAuthorsChart";
import WeeklyNewAuthorsChart from "./components/social/WeeklyNewAuthorsChart";
import StableAuthorsTable from "./components/social/StableAuthorsTable";
import ReplyGraph from "./components/social/ReplyGraph";

// Tops
import TopMessagesTable from "./components/TopMessagesTable";
import TopAuthorsTable from "./components/TopAuthorsTable";

import {
  parseMessages,
  buildTopAuthors,
  buildTopMessages,
  buildTopAuthorsByReactions,
  buildHourWeekdayHeatmap,
  buildDailyChart,
  buildWeeklyTrend,
  buildReplyGraph,
  isHumanAuthor,
} from "./lib/telegram";

import type { RawMessage, ParsedMessage, Row, Node, Link } from "./types";

/* ================= Helpers ================= */

function isParticipant(m: ParsedMessage): boolean {
  const forwarded =
    (m as any)?.forwarded_from || (m as any)?.saved_from ? true : false;
  const isService = (m as any)?.type === "service";
  const uidOk = m.from_id?.startsWith("user") ?? false;
  const nameOk = !!m.from && m.from.trim().length > 0;
  return !forwarded && !isService && uidOk && nameOk && isHumanAuthor(m);
}

function totalReactions(r?: Record<string, number> | any[]): number {
  if (!r) return 0;
  if (Array.isArray(r))
    return r.reduce((s, it) => s + (Number(it?.count) || 0), 0);
  return Object.values(r).reduce((a, b) => a + (Number(b) || 0), 0);
}

function sumSelected(
  r: Record<string, number> | any[] | undefined,
  selected: string[],
): number {
  if (!r) return 0;
  if (selected.length === 0) return totalReactions(r);
  if (Array.isArray(r)) {
    const map: Record<string, number> = {};
    for (const it of r) {
      const key = String(it?.emoji ?? "");
      if (!key) continue;
      map[key] = (map[key] ?? 0) + (Number(it?.count) || 0);
    }
    return selected.reduce((s, e) => s + (map[e] ?? 0), 0);
  }
  return selected.reduce((s, e) => s + (r[e] ?? 0), 0);
}

function wordsFromMessages(msgs: ParsedMessage[], limit = 50) {
  const freq: Record<string, number> = {};
  for (const m of msgs) {
    if (typeof m.text !== "string") continue;
    const tokens = m.text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .split(/\s+/)
      .filter((t: string) => t.length >= 2);
    for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count], i) => ({ rank: i + 1, word, count }));
}

function mediaStatsFromRaw(raw: RawMessage[]) {
  const map: Record<string, number> = {};
  for (const r of raw) {
    if (!r.from_id?.startsWith("user")) continue; // только участники
    if ((r as any)?.forwarded_from || (r as any)?.saved_from) continue; // убираем пересланные
    const t = r.media_type || "other";
    map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

function longestMessagesFromParsed(msgs: ParsedMessage[], limit = 10) {
  return msgs
    .filter((m) => typeof m.text === "string" && m.text.trim().length > 0)
    .map((m) => ({
      id: m.id,
      from: m.from,
      text: m.text,
      length: (m.text as string).length,
    }))
    .sort((a, b) => b.length - a.length)
    .slice(0, limit);
}

function topEmojisFromParsed(msgs: ParsedMessage[], limit = 20) {
  const counter: Record<string, number> = {};
  for (const m of msgs) {
    const r = m.reactions as Record<string, number> | any[] | undefined;
    if (!r) continue;
    if (Array.isArray(r)) {
      for (const it of r) {
        const key = String(it?.emoji ?? "");
        if (!key) continue;
        counter[key] = (counter[key] ?? 0) + (Number(it?.count) || 0);
      }
    } else {
      for (const [k, v] of Object.entries(r)) {
        counter[k] = (counter[k] ?? 0) + (Number(v) || 0);
      }
    }
  }
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([emoji, count], i) => ({ rank: i + 1, emoji, count }));
}

function reactionsDailyFromParsed(msgs: ParsedMessage[]) {
  const map = new Map<string, number>();
  for (const m of msgs) {
    const date = String(m.fullDateISO).slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + totalReactions(m.reactions as any));
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function topMessagesBySelected(
  msgs: ParsedMessage[],
  limit: number,
  selected: string[],
) {
  const arr = msgs
    .map((m) => ({
      id: m.id,
      from: m.from,
      text: typeof m.text === "string" ? m.text : "",
      reactions: sumSelected(m.reactions as any, selected),
      fullDateISO: m.fullDateISO,
    }))
    .filter((m) => m.reactions > 0)
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, limit);
  return arr;
}

function getWeekKey(d: Date) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((+d - +oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
  const ww = String(week).padStart(2, "0");
  return `${d.getFullYear()}-W${ww}`;
}

/* ================= Component ================= */

type RowWithId = Row & { id?: number };

export default function App() {
  const [raw, setRaw] = useState<RawMessage[]>([]);
  const [chatSlug, setChatSlug] = useState("");

  const parsedAll = useMemo<ParsedMessage[]>(() => parseMessages(raw), [raw]);
  const parsed = useMemo(() => parsedAll.filter(isParticipant), [parsedAll]);

  /* ---------- TOPS ---------- */
  const topMessagesAll = useMemo<RowWithId[]>(() => {
    const base = buildTopMessages(parsed, 2000);
    return base.map((r) => {
      const found = parsed.find(
        (m) =>
          m.from === r.from &&
          typeof m.text === "string" &&
          m.text === (r.text ?? ""),
      );
      return { ...r, id: found?.id };
    });
  }, [parsed]);

  const topAuthorsAll = useMemo(() => buildTopAuthors(parsed, 2000), [parsed]);

  /* ---------- ACTIVITY ---------- */
  const daily = useMemo(() => buildDailyChart(parsed), [parsed]);
  const weekly = useMemo(() => buildWeeklyTrend(parsed), [parsed]);
  const heat = useMemo(() => buildHourWeekdayHeatmap(parsed), [parsed]);

  /* ---------- CONTENT ---------- */
  const words = useMemo(() => wordsFromMessages(parsed, 200), [parsed]);
  const media = useMemo(() => mediaStatsFromRaw(raw), [raw]);
  const longMsgs = useMemo(
    () => longestMessagesFromParsed(parsed, 10),
    [parsed],
  );

  /* ---------- REACTIONS ---------- */
  const [selected, setSelected] = useState<string[]>([]);
  const reactDaily = useMemo(() => reactionsDailyFromParsed(parsed), [parsed]);
  const emojiTop = useMemo(() => topEmojisFromParsed(parsed, 50), [parsed]);

  const emojis = useMemo(() => {
    const set = new Set<string>();
    for (const m of parsed) {
      const r = m.reactions as any;
      if (!r) continue;
      if (Array.isArray(r)) {
        for (const it of r) if (it?.emoji) set.add(String(it.emoji));
      } else {
        for (const k of Object.keys(r)) set.add(k);
      }
    }
    return Array.from(set.values()).sort();
  }, [parsed]);

  const [reactMsgPage, setReactMsgPage] = useState(0);
  const reactMsgPageSize = 10;
  const reactMsgsAll = useMemo(
    () => topMessagesBySelected(parsed, 10_000, selected),
    [parsed, selected],
  );
  const reactMsgsPaged: RowWithId[] = useMemo(
    () =>
      reactMsgsAll
        .slice(
          reactMsgPage * reactMsgPageSize,
          (reactMsgPage + 1) * reactMsgPageSize,
        )
        .map((m, idx) => ({
          rank: reactMsgPage * reactMsgPageSize + idx + 1,
          id: m.id,
          from: m.from,
          text: m.text,
          reactions: m.reactions,
        })),
    [reactMsgsAll, reactMsgPage],
  );
  const reactAuthors = useMemo(
    () => buildTopAuthorsByReactions(parsed, 20),
    [parsed],
  );

  /* ---------- SOCIAL ---------- */
  const weeklyActiveData = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of parsed) {
      const wk = getWeekKey(new Date(m.fullDateISO));
      if (!map.has(wk)) map.set(wk, new Set());
      map.get(wk)!.add(m.from);
    }
    return Array.from(map.entries())
      .map(([date, set]) => ({ date, value: set.size }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [parsed]);

  const weeklyNewData = useMemo(() => {
    const firstSeen = new Map<string, string>(); // author -> week
    for (const m of parsed) {
      const wk = getWeekKey(new Date(m.fullDateISO));
      if (!firstSeen.has(m.from)) firstSeen.set(m.from, wk);
    }
    const count = new Map<string, number>();
    for (const wk of firstSeen.values()) {
      count.set(wk, (count.get(wk) ?? 0) + 1);
    }
    return Array.from(count.entries())
      .map(([week, newAuthors]) => ({ week, newAuthors }))
      .sort((a, b) => (a.week > b.week ? 1 : -1));
  }, [parsed]);

  const stableRowsFull: Row[] = useMemo(() => {
    const byAuthorWeek = new Map<string, Set<string>>();
    for (const m of parsed) {
      const wk = getWeekKey(new Date(m.fullDateISO));
      if (!byAuthorWeek.has(m.from)) byAuthorWeek.set(m.from, new Set());
      byAuthorWeek.get(m.from)!.add(wk);
    }
    return Array.from(byAuthorWeek.entries())
      .map(([name, weeksSet]) => ({
        rank: 0,
        from: name,
        weeks: weeksSet.size,
      }))
      .sort((a, b) => b.weeks! - a.weeks!)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [parsed]);

  // ВАЖНО: готовим данные для ReplyGraph заранее (без хуков в JSX)
  const replyGraphData = useMemo<{ nodes: Node[]; links: Link[] }>(
    () => buildReplyGraph(parsed),
    [parsed],
  );

  /* ---------- Pagination blocks ---------- */

  // Топ сообщений / авторов
  const [msgPage, setMsgPage] = useState(0);
  const [authorPage, setAuthorPage] = useState(0);
  const pageSizeMsgs = 10;
  const pageSizeAuthors = 10;

  const topMessagesPaged: RowWithId[] = useMemo(
    () =>
      topMessagesAll
        .slice(msgPage * pageSizeMsgs, (msgPage + 1) * pageSizeMsgs)
        .map((m, idx) => ({
          rank: msgPage * pageSizeMsgs + idx + 1,
          id: m.id,
          from: m.from,
          text: m.text ?? "",
          reactions: m.reactions ?? 0,
        })),
    [topMessagesAll, msgPage],
  );

  const topAuthorsPaged: { rank: number; from: string; count: number }[] =
    useMemo(
      () =>
        topAuthorsAll
          .slice(
            authorPage * pageSizeAuthors,
            (authorPage + 1) * pageSizeAuthors,
          )
          .map((a, idx) => ({
            rank: authorPage * pageSizeAuthors + idx + 1,
            from: a.from,
            count: a.count ?? 0,
          })),
      [topAuthorsAll, authorPage],
    );

  // Топ слов — пагинация 10
  const [wordsPage, setWordsPage] = useState(0);
  const wordsPageSize = 10;
  const wordsPaged = useMemo(
    () =>
      words
        .slice(wordsPage * wordsPageSize, (wordsPage + 1) * wordsPageSize)
        .map((w, i) => ({
          ...w,
          rank: wordsPage * wordsPageSize + i + 1,
        })),
    [words, wordsPage],
  );

  // Стабильные авторы — пагинация 10
  const [stablePage, setStablePage] = useState(0);
  const stablePageSize = 10;
  const stablePaged = useMemo(
    () =>
      stableRowsFull
        .slice(stablePage * stablePageSize, (stablePage + 1) * stablePageSize)
        .map((r, i) => ({
          ...r,
          rank: stablePage * stablePageSize + i + 1,
        })),
    [stableRowsFull, stablePage],
  );

  /* ---------- UI ---------- */

  const onJSON = (data: unknown) =>
    setRaw(
      Array.isArray((data as any)?.messages)
        ? ((data as any).messages as RawMessage[])
        : [],
    );

  const toggleEmoji = (e: string) =>
    setSelected((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );

  const [tab, setTab] = useState<
    "activity" | "tops" | "content" | "reactions" | "social"
  >("activity");

  return (
    <div className="min-h-screen bg-[#0a0a15] text-white">
      <div className="container py-6 space-y-6">
        <header className="flex justify-center items-center">
          <h1 className="text-3xl font-bold text-purple-400 drop-shadow-lg">
            Telegram Stats
          </h1>
        </header>

        <FileDrop onJSON={onJSON} />

        {parsed.length > 0 && (
          <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between gap-4 flex-wrap">
                <div className="hdr">⚙️ Навигация</div>
                <Tabs
                  tabs={[
                    { key: "activity", label: "Активность" },
                    { key: "tops", label: "Топы" },
                    { key: "content", label: "Контент" },
                    { key: "reactions", label: "Реакции" },
                    { key: "social", label: "Соц. динамика" },
                  ]}
                  value={tab}
                  onChange={(k) => setTab(k as any)}
                />
              </div>

              <div>
                <label className="lbl">Чат для ссылок (slug)</label>
                <input
                  value={chatSlug}
                  onChange={(e) => setChatSlug(e.target.value.trim())}
                  placeholder="например: horny_alice"
                  className="mt-1 w-full border rounded-lg px-3 py-2 bg-[#050510] border-slate-700 text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {parsed.length > 0 && tab === "activity" && (
          <>
            <TopDaysTable rows={daily} />
            <WeeklyTrend data={weekly} />
            <HourWeekdayHeatmap data={heat} />
            <DailyChart data={daily} />
          </>
        )}

        {parsed.length > 0 && tab === "tops" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Топ сообщений */}
              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="hdr">🔥 Топ сообщений</div>
                  <div className="flex gap-2">
                    <button
                      disabled={msgPage === 0}
                      onClick={() => setMsgPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                      aria-label="Назад"
                    >
                      ←
                    </button>
                    <button
                      disabled={
                        (msgPage + 1) * pageSizeMsgs >= topMessagesAll.length
                      }
                      onClick={() =>
                        setMsgPage((p) =>
                          (p + 1) * pageSizeMsgs >= topMessagesAll.length
                            ? p
                            : p + 1,
                        )
                      }
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                      aria-label="Вперед"
                    >
                      →
                    </button>
                  </div>
                </div>
                <TopMessagesTable rows={topMessagesPaged} chatSlug={chatSlug} />
              </div>

              {/* Топ авторов */}
              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="hdr">👤 Топ авторов</div>
                  <div className="flex gap-2">
                    <button
                      disabled={authorPage === 0}
                      onClick={() => setAuthorPage((p) => p - 1)}
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                    >
                      ←
                    </button>
                    <button
                      disabled={
                        (authorPage + 1) * pageSizeAuthors >=
                        topAuthorsAll.length
                      }
                      onClick={() => setAuthorPage((p) => p + 1)}
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
                <TopAuthorsTable rows={topAuthorsPaged as any} />
              </div>
            </div>
          </>
        )}

        {parsed.length > 0 && tab === "content" && (
          <>
            {/* Топ слов с пагинацией */}
            <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center mb-3">
                <div className="hdr">📝 Топ слов</div>
                <div className="flex gap-2">
                  <button
                    disabled={wordsPage === 0}
                    onClick={() => setWordsPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    disabled={(wordsPage + 1) * wordsPageSize >= words.length}
                    onClick={() =>
                      setWordsPage((p) =>
                        (p + 1) * wordsPageSize >= words.length ? p : p + 1,
                      )
                    }
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
              <TopWordsTable rows={wordsPaged as any} />
            </div>

            <MediaStatsTable stats={media} />
            <LongestMessagesTable rows={longMsgs} chatSlug={chatSlug} />
          </>
        )}

        {parsed.length > 0 && tab === "reactions" && (
          <>
            <ReactionsChart data={reactDaily} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopEmojisTable rows={emojiTop as any} />
              <TopReactionAuthorsTable rows={reactAuthors as Row[]} />
            </div>

            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="hdr">😁 Топ сообщений по реакциям</div>

                <div className="flex flex-wrap gap-2">
                  {emojis.map((e) => (
                    <button
                      key={e}
                      onClick={() => toggleEmoji(e)}
                      className={`px-2 py-1 rounded ${selected.includes(e) ? "bg-purple-600" : "bg-slate-700 hover:bg-purple-500"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex gap-2">
                  <button
                    disabled={reactMsgPage === 0}
                    onClick={() => setReactMsgPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    disabled={
                      (reactMsgPage + 1) * reactMsgPageSize >=
                      reactMsgsAll.length
                    }
                    onClick={() =>
                      setReactMsgPage((p) =>
                        (p + 1) * reactMsgPageSize >= reactMsgsAll.length
                          ? p
                          : p + 1,
                      )
                    }
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>

              <TopReactionMessagesTable
                rows={reactMsgsPaged}
                chatSlug={chatSlug}
              />
            </div>
          </>
        )}

        {parsed.length > 0 && tab === "social" && (
          <>
            <WeeklyActiveAuthorsChart data={weeklyActiveData} />
            <WeeklyNewAuthorsChart data={weeklyNewData} />

            <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center mb-3">
                <div className="hdr">📅 Стабильные авторы</div>
                <div className="flex gap-2">
                  <button
                    disabled={stablePage === 0}
                    onClick={() => setStablePage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    disabled={
                      (stablePage + 1) * stablePageSize >= stableRowsFull.length
                    }
                    onClick={() =>
                      setStablePage((p) =>
                        (p + 1) * stablePageSize >= stableRowsFull.length
                          ? p
                          : p + 1,
                      )
                    }
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
              <StableAuthorsTable rows={stablePaged} />
            </div>

            {/* ВАЖНО: без хуков внутри JSX */}
            <ReplyGraph data={replyGraphData} />
          </>
        )}

        <footer className="text-center text-xs text-gray-500 pt-6">
          Все данные обрабатываются локально в браузере
        </footer>
      </div>
    </div>
  );
}

import React, { useMemo, useState } from "react";

import FileDrop from "./components/FileDrop";
import Tabs from "./components/Tabs";

import TopDaysTable from "./components/activity/TopDaysTable";
import HourWeekdayHeatmap from "./components/activity/HourWeekdayHeatmap";
import WeeklyTrend from "./components/activity/WeeklyTrend";
import DailyChart from "./components/DailyChart";

import TopWordsTable from "./components/content/TopWordsTable";
import MediaStatsTable from "./components/content/MediaStatsTable";
import LongestMessagesTable from "./components/content/LongestMessagesTable";

import ReactionsChart from "./components/reactions/ReactionsChart";
import TopEmojisTable from "./components/reactions/TopEmojisTable";
import TopReactionAuthorsTable from "./components/reactions/TopReactionAuthorsTable";
import TopReactionMessagesTable from "./components/reactions/TopReactionMessagesTable";

import WeeklyActiveAuthorsChart from "./components/social/WeeklyActiveAuthorsChart";
import WeeklyNewAuthorsChart from "./components/social/WeeklyNewAuthorsChart";
import StableAuthorsTable from "./components/social/StableAuthorsTable";
import ReplyGraph from "./components/social/ReplyGraph";

import TopAuthorsTable from "./components/TopAuthorsTable";
import TopMessagesTable from "./components/TopMessagesTable";

import {
  parseMessages,
  buildTopAuthors,
  buildTopMessages,
  buildTopAuthorsByReactions,
  buildHourWeekdayHeatmap,
  buildDailyChart,
  buildWeeklyTrend,
  buildReplyGraph,
} from "./lib/telegram";

import type { RawMessage, ParsedMessage } from "./types";

// ===== helpers =====
const pageSlice = <T,>(arr: T[], page: number, size: number) =>
  arr.slice(page * size, (page + 1) * size);

const totalReactions = (r?: Record<string, number>): number =>
  Object.values(r ?? {}).reduce((a, b) => a + b, 0);

// monday of week for a date -> 'YYYY-MM-DD'
function weekStartISO(d: Date): string {
  const day = d.getDay(); // 0..6, 0=Sun
  const diff = (day + 6) % 7; // Mon=0
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  start.setUTCDate(start.getUTCDate() - diff);
  const yyyy = start.getUTCFullYear();
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// 'YYYY-W##'
function weekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // ISO week number
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const isHuman = (m: ParsedMessage) => {
  // пустые имена/каналы/боты/пересланные — отбрасываем
  const id = m.from_id ?? "";
  if (!m.from || m.from.trim().length === 0) return false;
  if (id.startsWith("channel") || id.startsWith("bot")) return false;
  // метки пересылок могут отсутствовать в типах — проверяем через any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyM = m as any;
  if (anyM.forwarded_from || anyM.saved_from) return false;
  return true;
};

// ===== main =====
export default function App() {
  const [raw, setRaw] = useState<RawMessage[]>([]);
  const [chatSlug, setChatSlug] = useState("");

  // dnd загрузка JSON (Telegram export)
  const onJSON = (data: unknown) => {
    const msgs = Array.isArray((data as any)?.messages)
      ? ((data as any).messages as RawMessage[])
      : [];
    setRaw(msgs);
  };

  const parsed: ParsedMessage[] = useMemo(() => parseMessages(raw), [raw]);

  // только люди
  const humans = useMemo(() => parsed.filter(isHuman), [parsed]);

  // ---------- Активность ----------
  const dailyTop = useMemo(() => {
    const byDate = new Map<string, number>();
    humans.forEach((m) => {
      const d = m.fullDateISO.slice(0, 10);
      byDate.set(d, (byDate.get(d) ?? 0) + 1);
    });
    return Array.from(byDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) =>
        a.count === b.count ? (a.date > b.date ? -1 : 1) : b.count - a.count,
      );
  }, [humans]);

  const heat = useMemo(() => buildHourWeekdayHeatmap(humans), [humans]);
  const dailyChart = useMemo(() => buildDailyChart(humans), [humans]); // {date,count}
  const weeklyTrend = useMemo(() => buildWeeklyTrend(humans), [humans]); // {week,count}

  // ---------- Топы ----------
  const topAuthorsAll = useMemo(
    () => buildTopAuthors(humans, 10_000),
    [humans],
  );
  const topMessagesAll = useMemo(
    () => buildTopMessages(humans, 10_000),
    [humans],
  );

  const [authorPage, setAuthorPage] = useState(0);
  const [msgPage, setMsgPage] = useState(0);
  const pageSizeAuthors = 10;
  const pageSizeMsgs = 10;

  const topAuthorsPaged = useMemo(
    () =>
      pageSlice(topAuthorsAll, authorPage, pageSizeAuthors).map((r, i) => ({
        rank: authorPage * pageSizeAuthors + i + 1,
        from: r.from,
        count: r.count ?? 0,
      })),
    [topAuthorsAll, authorPage],
  );

  const topMessagesPaged = useMemo(
    () =>
      pageSlice(topMessagesAll, msgPage, pageSizeMsgs).map((m, i) => ({
        rank: msgPage * pageSizeMsgs + i + 1,
        id: (m as any).id ?? i,
        from: m.from,
        text: m.text ?? "",
        reactions:
          m.reactions ??
          totalReactions(
            (m as unknown as { reactions?: Record<string, number> }).reactions,
          ),
      })),
    [topMessagesAll, msgPage],
  );

  // ---------- Контент ----------
  const wordsAll = useMemo(() => {
    const freq: Record<string, number> = {};
    humans.forEach((m) => {
      const text = (m.text ?? "") as string;
      const tokens = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);
      for (const t of tokens) freq[t] = (freq[t] ?? 0) + 1;
    });
    return Object.entries(freq)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }, [humans]);

  const [wordsPage, setWordsPage] = useState(0);
  const wordsPageSize = 10;
  const wordsPaged = useMemo(
    () =>
      pageSlice(wordsAll, wordsPage, wordsPageSize).map((w, i) => ({
        rank: wordsPage * wordsPageSize + i + 1,
        word: w.word,
        count: w.count,
      })),
    [wordsAll, wordsPage],
  );

  const mediaStatsMap = useMemo(() => {
    const stats: Record<string, number> = {};
    humans.forEach((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mt = (m as any).media_type as string | undefined;
      if (mt) stats[mt] = (stats[mt] ?? 0) + 1;
    });
    return stats;
  }, [humans]);

  const longMsgs = useMemo(() => {
    return humans
      .map((m) => ({
        id: (m as any).id as number,
        from: m.from,
        text: m.text ?? "",
        length: (m.text ?? "").length,
      }))
      .sort((a, b) => b.length - a.length)
      .slice(0, 50);
  }, [humans]);

  // ---------- Реакции ----------
  const reactDaily = useMemo(() => {
    const map = new Map<string, number>();
    humans.forEach((m) => {
      const d = m.fullDateISO.slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + totalReactions((m as any).reactions));
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [humans]);

  const emojis = useMemo(() => {
    const set = new Set<string>();
    humans.forEach((m) => {
      const r = (m as any).reactions as Record<string, number> | undefined;
      if (!r) return;
      for (const k of Object.keys(r)) set.add(k);
    });
    return Array.from(set.values()).sort();
  }, [humans]);

  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const toggleEmoji = (e: string) =>
    setSelectedEmojis((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  const clearEmojis = () => setSelectedEmojis([]);

  const emojiCountsAll = useMemo(() => {
    const cnt: Record<string, number> = {};
    humans.forEach((m) => {
      const r = (m as any).reactions as Record<string, number> | undefined;
      if (!r) return;
      for (const k in r) cnt[k] = (cnt[k] ?? 0) + r[k];
    });
    return Object.entries(cnt)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }, [humans]);

  const [emojiPage, setEmojiPage] = useState(0);
  const emojiPageSize = 10;
  const emojiTopPaged = useMemo(
    () =>
      pageSlice(emojiCountsAll, emojiPage, emojiPageSize).map((e, i) => ({
        rank: emojiPage * emojiPageSize + i + 1,
        emoji: e.emoji,
        count: e.count,
      })),
    [emojiCountsAll, emojiPage],
  );

  const reactAuthorsAll = useMemo(
    () => buildTopAuthorsByReactions(humans, 10_000),
    [humans],
  );
  const [reactAuthorPage, setReactAuthorPage] = useState(0);
  const reactAuthorPageSize = 10;
  const reactAuthorsPaged = useMemo(
    () =>
      pageSlice(reactAuthorsAll, reactAuthorPage, reactAuthorPageSize).map(
        (r, i) => ({
          rank: reactAuthorPage * reactAuthorPageSize + i + 1,
          from: r.from,
          reactions: r.reactions ?? 0,
        }),
      ),
    [reactAuthorsAll, reactAuthorPage],
  );

  const reactMsgsAll = useMemo(() => {
    const filtered = humans.filter((m) => {
      if (selectedEmojis.length === 0) return true;
      const r = (m as any).reactions as Record<string, number> | undefined;
      return selectedEmojis.some((e) => (r?.[e] ?? 0) > 0);
    });
    return filtered
      .map((m) => ({
        id: (m as any).id as number,
        from: m.from,
        text: m.text ?? "",
        reactions: totalReactions((m as any).reactions),
      }))
      .sort((a, b) => b.reactions - a.reactions);
  }, [humans, selectedEmojis]);

  const [reactMsgPage, setReactMsgPage] = useState(0);
  const reactMsgPageSize = 10;
  const reactMsgsPaged = useMemo(
    () =>
      pageSlice(reactMsgsAll, reactMsgPage, reactMsgPageSize).map((m, i) => ({
        rank: reactMsgPage * reactMsgPageSize + i + 1,
        ...m,
      })),
    [reactMsgsAll, reactMsgPage],
  );

  // ---------- Соц. динамика ----------
  // { date (понедельник недели), value: кол-во активных авторов за неделю }
  const weeklyActiveData = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    humans.forEach((m) => {
      const d = new Date(m.fullDateISO);
      const wkDate = weekStartISO(d);
      map[wkDate] = map[wkDate] ?? new Set<string>();
      map[wkDate].add(m.from);
    });
    return Object.entries(map)
      .map(([date, set]) => ({ date, value: set.size }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [humans]);

  // { week: 'YYYY-W##', newAuthors: кол-во авторов, впервые написавших в эту неделю }
  const weeklyNewData = useMemo(() => {
    const firstWeekByAuthor = new Map<string, string>();
    humans.forEach((m) => {
      const wk = weekKey(new Date(m.fullDateISO));
      if (!firstWeekByAuthor.has(m.from)) firstWeekByAuthor.set(m.from, wk);
    });
    const countByWeek = new Map<string, number>();
    for (const wk of firstWeekByAuthor.values()) {
      countByWeek.set(wk, (countByWeek.get(wk) ?? 0) + 1);
    }
    return Array.from(countByWeek.entries())
      .map(([week, newAuthors]) => ({ week, newAuthors }))
      .sort((a, b) => (a.week > b.week ? 1 : -1));
  }, [humans]);

  // стабильные авторы с пагинацией
  const stableAll = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    humans.forEach((m) => {
      const d = new Date(m.fullDateISO);
      const wk = weekKey(d);
      map[m.from] = map[m.from] ?? new Set<string>();
      map[m.from].add(wk);
    });
    return Object.entries(map)
      .map(([from, weeksSet]) => ({ from, weeks: weeksSet.size }))
      .sort((a, b) => b.weeks - a.weeks);
  }, [humans]);

  const [stablePage, setStablePage] = useState(0);
  const stablePageSize = 10;
  const stablePaged = useMemo(
    () =>
      pageSlice(stableAll, stablePage, stablePageSize).map((r, i) => ({
        rank: stablePage * stablePageSize + i + 1,
        from: r.from,
        weeks: r.weeks,
      })),
    [stableAll, stablePage],
  );

  const replyGraph = useMemo(() => buildReplyGraph(humans), [humans]);

  // ---------- tabs ----------
  const [tab, setTab] = useState<
    "activity" | "tops" | "content" | "reactions" | "social"
  >("activity");

  return (
    <div className="min-h-screen bg-[#050510] text-white">
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

        {/* ===== Активность: 🏆 → 🕒 → 📈 дням → 📈 неделям ===== */}
        {parsed.length > 0 && tab === "activity" && (
          <>
            <TopDaysTable rows={dailyTop} />
            <HourWeekdayHeatmap data={heat} />
            <DailyChart data={dailyChart} />
            <WeeklyTrend data={weeklyTrend} />
          </>
        )}

        {/* ===== Топы: авторы слева, сообщения справа ===== */}
        {parsed.length > 0 && tab === "tops" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center mb-3">
                <div className="hdr">👤 Топ авторов</div>
                <div className="flex gap-2">
                  <button
                    disabled={authorPage === 0}
                    onClick={() => setAuthorPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                    aria-label="Назад"
                  >
                    ←
                  </button>
                  <button
                    disabled={
                      (authorPage + 1) * pageSizeAuthors >= topAuthorsAll.length
                    }
                    onClick={() =>
                      setAuthorPage((p) =>
                        (p + 1) * pageSizeAuthors >= topAuthorsAll.length
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
              <TopAuthorsTable rows={topAuthorsPaged} />
            </div>

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
              <TopMessagesTable
                rows={topMessagesPaged as any}
                chatSlug={chatSlug}
              />
            </div>
          </div>
        )}

        {/* ===== Контент ===== */}
        {parsed.length > 0 && tab === "content" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="hdr">🧠 Топ слов</div>
                  <div className="flex gap-2">
                    <button
                      disabled={wordsPage === 0}
                      onClick={() => setWordsPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                      aria-label="Назад"
                    >
                      ←
                    </button>
                    <button
                      disabled={
                        (wordsPage + 1) * wordsPageSize >= wordsAll.length
                      }
                      onClick={() =>
                        setWordsPage((p) =>
                          (p + 1) * wordsPageSize >= wordsAll.length
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
                <TopWordsTable rows={wordsPaged as any} />
              </div>

              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="hdr mb-3">🖼️ Медиа-статистика</div>
                <MediaStatsTable stats={mediaStatsMap} />
              </div>
            </div>

            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="hdr mb-3">✍️ Самые длинные сообщения</div>
              <LongestMessagesTable rows={longMsgs} chatSlug={chatSlug} />
            </div>
          </>
        )}

        {/* ===== Реакции ===== */}
        {parsed.length > 0 && tab === "reactions" && (
          <>
            <ReactionsChart data={reactDaily} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="hdr">😊 Популярные эмодзи</div>
                  <div className="flex gap-2">
                    <button
                      disabled={emojiPage === 0}
                      onClick={() => setEmojiPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                      aria-label="Назад"
                    >
                      ←
                    </button>
                    <button
                      disabled={
                        (emojiPage + 1) * emojiPageSize >= emojiCountsAll.length
                      }
                      onClick={() =>
                        setEmojiPage((p) =>
                          (p + 1) * emojiPageSize >= emojiCountsAll.length
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
                <TopEmojisTable rows={emojiTopPaged as any} />
              </div>

              <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
                <div className="flex justify-between items-center mb-3">
                  <div className="hdr">
                    👥 Авторы с наибольшим количеством реакций
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={reactAuthorPage === 0}
                      onClick={() =>
                        setReactAuthorPage((p) => Math.max(0, p - 1))
                      }
                      className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                      aria-label="Назад"
                    >
                      ←
                    </button>
                    <button
                      disabled={
                        (reactAuthorPage + 1) * reactAuthorPageSize >=
                        reactAuthorsAll.length
                      }
                      onClick={() =>
                        setReactAuthorPage((p) =>
                          (p + 1) * reactAuthorPageSize >=
                          reactAuthorsAll.length
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
                <TopReactionAuthorsTable rows={reactAuthorsPaged as any} />
              </div>
            </div>

            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="hdr">😁 Топ сообщений по реакциям</div>
                <div className="flex flex-wrap gap-2 ml-auto">
                  {emojis.map((e) => {
                    const active = selectedEmojis.includes(e);
                    return (
                      <button
                        key={e}
                        onClick={() => toggleEmoji(e)}
                        className={`px-2 py-1 rounded-full border border-slate-700 ${
                          active
                            ? "bg-purple-600"
                            : "bg-slate-700 hover:bg-purple-500"
                        } transition`}
                        aria-label={`Фильтр ${e}`}
                      >
                        {e}
                      </button>
                    );
                  })}
                  {selectedEmojis.length > 0 && (
                    <button
                      onClick={clearEmojis}
                      className="px-2 py-1 rounded-full border border-slate-700 bg-slate-800 hover:bg-slate-700"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  disabled={reactMsgPage === 0}
                  onClick={() => setReactMsgPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  aria-label="Назад"
                >
                  ←
                </button>
                <button
                  disabled={
                    (reactMsgPage + 1) * reactMsgPageSize >= reactMsgsAll.length
                  }
                  onClick={() =>
                    setReactMsgPage((p) =>
                      (p + 1) * reactMsgPageSize >= reactMsgsAll.length
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

              <TopReactionMessagesTable
                rows={reactMsgsPaged as any}
                chatSlug={chatSlug}
              />
            </div>
          </>
        )}

        {/* ===== Соц. динамика ===== */}
        {parsed.length > 0 && tab === "social" && (
          <>
            <WeeklyActiveAuthorsChart data={weeklyActiveData} />
            <WeeklyNewAuthorsChart data={weeklyNewData} />

            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex justify-between items-center mb-3">
                <div className="hdr">
                  📅 Стабильные авторы (пишут каждую неделю)
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={stablePage === 0}
                    onClick={() => setStablePage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                    aria-label="Назад"
                  >
                    ←
                  </button>
                  <button
                    disabled={
                      (stablePage + 1) * stablePageSize >= stableAll.length
                    }
                    onClick={() =>
                      setStablePage((p) =>
                        (p + 1) * stablePageSize >= stableAll.length
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
              <StableAuthorsTable rows={stablePaged as any} />
            </div>

            <ReplyGraph data={replyGraph} />
          </>
        )}

        <footer className="text-center text-xs text-gray-500 pt-6">
          Все данные обрабатываются локально в браузере
        </footer>
      </div>
    </div>
  );
}

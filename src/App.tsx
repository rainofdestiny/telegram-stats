import React, { useMemo, useState } from "react";
import FileDrop from "./components/FileDrop";
import Tabs from "./components/Tabs";

import TopMessagesTable from "./components/TopMessagesTable";
import TopAuthorsTable from "./components/TopAuthorsTable";
import DailyChart from "./components/DailyChart";

import TopDaysTable from "./components/activity/TopDaysTable";
import WeeklyTrend from "./components/activity/WeeklyTrend";
import HourWeekdayHeatmap from "./components/activity/HourWeekdayHeatmap";

import TopWordsTable from "./components/content/TopWordsTable";
import MediaStatsTable from "./components/content/MediaStatsTable";
import LongestMessagesTable from "./components/content/LongestMessagesTable";

import ReactionsChart from "./components/reactions/ReactionsChart";
import TopEmojisTable from "./components/reactions/TopEmojisTable";
import TopReactionMessagesTable from "./components/reactions/TopReactionMessagesTable";
import TopReactionAuthorsTable from "./components/reactions/TopReactionAuthorsTable";

import WeeklyActiveAuthorsChart from "./components/social/WeeklyActiveAuthorsChart";
import WeeklyNewAuthorsChart from "./components/social/WeeklyNewAuthorsChart";
import StableAuthorsTable from "./components/social/StableAuthorsTable";
import ReplyGraph from "./components/social/ReplyGraph";

import { parseMessages, buildReplyGraph } from "./lib/telegram";
import type { RawMessage, ParsedMessage } from "./types";

// ---------- утилиты (локальные, чтобы не зависеть от экспортов) ----------

// Нормализация реакций: массив из экспортов Telegram Desktop -> в { emoji: count }
function toReactionsMap(r: unknown): Record<string, number> {
  if (!r) return {};
  if (Array.isArray(r)) {
    const out: Record<string, number> = {};
    for (const it of r as any[]) {
      const key =
        typeof it?.emoji === "string" ? it.emoji : String(it?.emoji ?? "");
      const cnt = typeof it?.count === "number" ? it.count : 0;
      if (!key) continue;
      out[key] = (out[key] ?? 0) + cnt;
    }
    return out;
  }
  return r as Record<string, number>;
}

const isHuman = (m: ParsedMessage) =>
  m.from && m.from !== "service" && !/бот|bot/i.test(m.from);

const byDateKey = (iso: string) => iso.slice(0, 10);
const weekKey = (d: Date) => {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const ndays = Math.floor((+d - +oneJan) / 86400000);
  const wk = Math.ceil((d.getDay() + 1 + ndays) / 7);
  return `${d.getFullYear()}-W${wk}`;
};

// ---------- компонент ----------
export default function App() {
  const [raw, setRaw] = useState<RawMessage[]>([]);
  const [chatSlug, setChatSlug] = useState("");
  const [tab, setTab] = useState<
    "activity" | "tops" | "content" | "reactions" | "social"
  >("activity");

  const parsed: ParsedMessage[] = useMemo(() => parseMessages(raw), [raw]);
  // Только люди: не каналы, не боты, не сервис, допускаем пустое имя
  const humans = useMemo(
    () =>
      parsed.filter((m) => {
        const from = (m.from ?? "").toLowerCase();
        const isUser = (m.from_id ?? "").startsWith("user");
        const notBot = !from.endsWith("bot");
        return isUser && notBot;
      }),
    [parsed],
  );

  // Топ сообщений по сумме реакций, только от людей, пагинация
  const [msgPage, setMsgPage] = useState(0);
  const pageSizeMsgs = 10;

  const topMessagesAll = useMemo(() => {
    const sorted = [...humans]
      .filter((m) => (m.total ?? 0) > 0) // сообщения с реакциями
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    return sorted.map((m, idx) => ({
      rank: idx + 1,
      id: m.id, // нужен для ссылок в таблице
      from: m.from || "(без имени)",
      text: m.text || "",
      reactions: m.total ?? 0,
    }));
  }, [humans]);

  const topMessagesPaged = useMemo(
    () =>
      topMessagesAll.slice(
        msgPage * pageSizeMsgs,
        (msgPage + 1) * pageSizeMsgs,
      ),
    [topMessagesAll, msgPage],
  );

  // ---- Топ авторов (по числу сообщений) + пагинация
  const pageSizeAuthors = 10;
  const [authorPage, setAuthorPage] = useState(0);
  const topAuthorsAll = useMemo(() => {
    const cnt: Record<string, number> = {};
    humans.forEach((m) => (cnt[m.from] = (cnt[m.from] ?? 0) + 1));
    return Object.entries(cnt)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [humans]);
  const topAuthorsPaged = useMemo(
    () =>
      topAuthorsAll
        .slice(authorPage * pageSizeAuthors, (authorPage + 1) * pageSizeAuthors)
        .map((a, idx) => ({
          rank: authorPage * pageSizeAuthors + idx + 1,
          from: a.name,
          count: a.count,
        })),
    [topAuthorsAll, authorPage],
  );

  // ---- Активность
  const daily = useMemo(() => {
    const map: Record<string, number> = {};
    humans.forEach((m) => {
      const k = byDateKey(m.fullDateISO);
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [humans]);

  const weekly = useMemo(() => {
    const map: Record<string, number> = {};
    humans.forEach((m) => {
      const k = weekKey(new Date(m.fullDateISO));
      map[k] = (map[k] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => (a.week > b.week ? 1 : -1));
  }, [humans]);

  const heat = useMemo(
    () =>
      humans.reduce(
        (acc: { weekday: number; hour: number; count: number }[], m) => {
          const d = new Date(m.fullDateISO);
          const weekday = (d.getDay() + 6) % 7;
          const hour = d.getHours();
          const row = acc.find((r) => r.weekday === weekday && r.hour === hour);
          if (row) row.count++;
          else acc.push({ weekday, hour, count: 1 });
          return acc;
        },
        [],
      ),
    [humans],
  );

  // ---- Контент
  const mediaStats = useMemo(() => {
    const out: Record<string, number> = {};
    parsed.forEach((m) => {
      if (m.media_type) out[m.media_type] = (out[m.media_type] ?? 0) + 1;
    });
    return out;
  }, [parsed]);

  const longest = useMemo(
    () =>
      [...humans]
        .filter((m) => m.text)
        .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))
        .slice(0, 10)
        .map((m, idx) => ({
          rank: idx + 1,
          id: m.id,
          from: m.from,
          text: m.text!,
        })),
    [humans],
  );

  const topWords = useMemo(() => {
    const freq: Record<string, number> = {};
    humans.forEach((m) => {
      (m.text || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, " ")
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => (freq[w] = (freq[w] ?? 0) + 1));
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count], i) => ({ rank: i + 1, from: word, count }));
  }, [humans]);

  // ---- Реакции
  const allEmojis = useMemo(() => {
    const set = new Set<string>();
    parsed.forEach((m) =>
      Object.keys(m.reactions ?? {}).forEach((e) => set.add(e)),
    );
    return [...set];
  }, [parsed]);

  const [selected, setSelected] = useState<string[]>([]);
  const toggleEmoji = (e: string) =>
    setSelected((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );

  // ---- Реакции: дневной график
  const reactionsDaily = useMemo(() => {
    const map: Record<string, number> = {};
    parsed.forEach((m) => {
      const sum = Object.values(m.reactions ?? {}).reduce((a, b) => a + b, 0);
      const k = byDateKey(m.fullDateISO);
      map[k] = (map[k] ?? 0) + sum;
    });
    return Object.entries(map)
      .map(([date, count]) => ({ date, count })) // <-- count, не value
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [parsed]);

  const emojiTop = useMemo(() => {
    const cnt: Record<string, number> = {};
    parsed.forEach((m) =>
      Object.entries(m.reactions ?? {}).forEach(
        ([e, n]) => (cnt[e] = (cnt[e] ?? 0) + n),
      ),
    );
    return Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([e, total], i) => ({ rank: i + 1, from: e, count: total }));
  }, [parsed]);

  const reactMsgPageSize = 10;
  const [reactMsgPage, setReactMsgPage] = useState(0);
  const reactMsgsAll = useMemo(() => {
    const filterByEmoji = (m: ParsedMessage) =>
      selected.length === 0 ||
      selected.some((e) => (toReactionsMap(m.reactions)[e] ?? 0) > 0);

    return humans
      .filter(filterByEmoji)
      .map((m) => ({
        id: m.id,
        from: m.from,
        text: m.text || "(без текста)",
        reactions: Object.values(m.reactions ?? {}).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.reactions - a.reactions);
  }, [humans, selected]);

  const reactMsgsPaged = useMemo(
    () =>
      reactMsgsAll
        .slice(
          reactMsgPage * reactMsgPageSize,
          (reactMsgPage + 1) * reactMsgPageSize,
        )
        .map((r, idx) => ({
          rank: reactMsgPage * reactMsgPageSize + idx + 1,
          ...r,
        })),
    [reactMsgsAll, reactMsgPage],
  );

  const reactAuthors = useMemo(() => {
    const cnt: Record<string, number> = {};
    humans.forEach((m) => {
      const sum = Object.values(m.reactions ?? {}).reduce((a, b) => a + b, 0);
      if (selected.length === 0) {
        cnt[m.from] = (cnt[m.from] ?? 0) + sum;
      } else {
        const add = selected.reduce(
          (s, e) => s + (toReactionsMap(m.reactions)[e] ?? 0),
          0,
        );
        cnt[m.from] = (cnt[m.from] ?? 0) + add;
      }
    });
    return Object.entries(cnt)
      .map(([from, reactions]) => ({ from, reactions }))
      .sort((a, b) => b.reactions - a.reactions)
      .slice(0, 20)
      .map((r, i) => ({ rank: i + 1, ...r }));
  }, [humans, selected]);

  // ---- Социальная динамика
  const weeklyActive = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    humans.forEach((m) => {
      const k = weekKey(new Date(m.fullDateISO));
      (map[k] ??= new Set()).add(m.from);
    });
    return Object.entries(map)
      .map(([date, set]) => ({ date, value: set.size }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [humans]);

  const weeklyNew = useMemo(() => {
    const firstWeek: Record<string, string> = {};
    humans.forEach((m) => {
      const w = weekKey(new Date(m.fullDateISO));
      if (!firstWeek[m.from]) firstWeek[m.from] = w;
    });
    const map: Record<string, number> = {};
    Object.values(firstWeek).forEach((w) => (map[w] = (map[w] ?? 0) + 1));
    return Object.entries(map)
      .map(([week, newAuthors]) => ({ week, newAuthors }))
      .sort((a, b) => (a.week > b.week ? 1 : -1));
  }, [humans]);

  const stable = useMemo(() => {
    const weeksByAuthor: Record<string, Set<string>> = {};
    humans.forEach((m) => {
      const w = weekKey(new Date(m.fullDateISO));
      (weeksByAuthor[m.from] ??= new Set()).add(w);
    });
    return Object.entries(weeksByAuthor)
      .map(([name, set]) => ({ name, weeks: set.size }))
      .sort((a, b) => b.weeks - a.weeks)
      .slice(0, 20)
      .map((r, i) => ({ rank: i + 1, ...r }));
  }, [humans]);

  const replyGraph = useMemo(() => buildReplyGraph(humans), [humans]);

  // ---- загрузка файла
  const onJSON = (data: any) =>
    setRaw(
      Array.isArray(data?.messages) ? (data.messages as RawMessage[]) : [],
    );

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

        {parsed.length > 0 && tab === "activity" && (
          <>
            <HourWeekdayHeatmap data={heat} />
            <TopDaysTable rows={daily} />
            <DailyChart data={daily} />
            <WeeklyTrend data={weekly} />
          </>
        )}

        {parsed.length > 0 && tab === "tops" && (
          <>
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
                      (authorPage + 1) * pageSizeAuthors >= topAuthorsAll.length
                    }
                    onClick={() => setAuthorPage((p) => p + 1)}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
              <TopAuthorsTable rows={topAuthorsPaged as any} bare />
            </div>

            {/* Топ сообщений */}
            <div className="relative mb-6">
              {/* Кнопки пагинации в правом верхнем углу карточки */}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
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

              {/* Карточка рендерится самим компонентом таблицы — без внешней рамки */}
              <TopMessagesTable
                rows={topMessagesPaged as any}
                chatSlug={chatSlug}
              />
            </div>
          </>
        )}

        {parsed.length > 0 && tab === "content" && (
          <>
            <TopWordsTable rows={topWords as any} />
            <MediaStatsTable stats={mediaStats} />
            <LongestMessagesTable rows={longest as any} chatSlug={chatSlug} />
          </>
        )}

        {parsed.length > 0 && tab === "reactions" && (
          <>
            <ReactionsChart data={reactionsDaily} />
            <TopEmojisTable rows={emojiTop as any} />

            <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="hdr">Топ сообщений по реакциям</div>
                <div className="flex flex-wrap gap-2">
                  {allEmojis.map((e) => (
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
                    onClick={() => setReactMsgPage((p) => p - 1)}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    disabled={
                      (reactMsgPage + 1) * reactMsgPageSize >=
                      reactMsgsAll.length
                    }
                    onClick={() => setReactMsgPage((p) => p + 1)}
                    className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>

              <TopReactionMessagesTable
                rows={reactMsgsPaged as any}
                chatSlug={chatSlug}
              />
            </div>

            <TopReactionAuthorsTable rows={reactAuthors as any} />
          </>
        )}

        {parsed.length > 0 && tab === "social" && (
          <>
            <WeeklyActiveAuthorsChart data={weeklyActive} />
            <WeeklyNewAuthorsChart data={weeklyNew} />
            <StableAuthorsTable rows={stable as any} />
            <ReplyGraph data={replyGraph as any} />
          </>
        )}

        <footer className="text-center text-xs text-gray-500 pt-6">
          Все данные обрабатываются локально в браузере
        </footer>
      </div>
    </div>
  );
}

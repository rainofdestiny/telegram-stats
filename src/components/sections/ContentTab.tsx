import React, { useMemo, useState } from "react";
import TopWordsTable from "../content/TopWordsTable";
import MediaStatsTable from "../content/MediaStatsTable";
import LongestMessagesCard from "../content/LongestMessagesCard";
import type { ParsedMessage } from "../../types";
import { pageSlice } from "../../lib/helpers";

export default function ContentTab({
  humans,
  chatSlug,
}: {
  humans: ParsedMessage[];
  chatSlug: string;
}) {
  // ===== TOP WORDS =====
  const wordsAll = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of humans) {
      const t = (m.text ?? "").toString().toLowerCase();
      const tokens = t.match(/\p{L}[\p{L}\p{N}]{1,}/gu) ?? [];
      for (const w of tokens) counts[w] = (counts[w] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  }, [humans]);

  const [wordsPage, setWordsPage] = useState(0);
  const wordsPageSize = 10;
  const wordsPaged = useMemo(
    () =>
      pageSlice(wordsAll, wordsPage, wordsPageSize).map(
        (w: { word: string; count: number }, i: number) => ({
          rank: wordsPage * wordsPageSize + i + 1,
          word: w.word,
          count: w.count,
        }),
      ),
    [wordsAll, wordsPage],
  );

  // ===== MEDIA STATS =====
  const mediaStats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of humans) {
      const mt = m.media_type;
      if (!mt) continue;
      map[mt] = (map[mt] ?? 0) + 1;
    }
    const ru: Record<string, string> = {
      sticker: "Стикер",
      photo: "Фото",
      video: "Видео",
      voice_message: "Голосовое сообщение",
      video_message: "Видео-сообщение",
      poll: "Опрос",
      audio: "Аудио",
      file: "Файл",
      animation: "Анимация",
      gif: "GIF",
    };
    const out: Record<string, number> = {};
    for (const k of Object.keys(map)) out[ru[k] ?? k] = map[k];
    return out;
  }, [humans]);

  // ===== LONGEST MESSAGES (ТОП-10) — этот компонент уже сам карточка =====
  const longRowsTop10 = useMemo(
    () =>
      [...humans]
        .map((m) => ({
          id: (m as any).id as number,
          from: m.from,
          text: m.text ?? "",
          length: String(m.text ?? "").length,
        }))
        .sort((a, b) => b.length - a.length)
        .slice(0, 10),
    [humans],
  );

  return (
    <div className="space-y-6">
      {/* Ряд: Топ слов + Медиа-статистика (таблицы — card здесь) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
          <div className="flex justify-between items-center mb-3">
            <div className="hdr">📝 Топ слов</div>
            {wordsAll.length > wordsPageSize && (
              <div className="flex gap-2">
                <button
                  disabled={wordsPage === 0}
                  onClick={() => setWordsPage((p) => Math.max(0, p - 1))}
                  className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  disabled={(wordsPage + 1) * wordsPageSize >= wordsAll.length}
                  onClick={() =>
                    setWordsPage((p) =>
                      (p + 1) * wordsPageSize >= wordsAll.length ? p : p + 1,
                    )
                  }
                  className="px-3 py-1 bg-slate-700 rounded-full hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            )}
          </div>
          <TopWordsTable rows={wordsPaged as any} />
        </div>

        <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
          <div className="hdr mb-3">🖼️ Медиа-статистика</div>
          <MediaStatsTable stats={mediaStats} />
        </div>
      </div>

      {/* Без обёртки, т.к. компонент уже карточка с заголовком */}
      <LongestMessagesCard rows={longRowsTop10} chatSlug={chatSlug} />
    </div>
  );
}

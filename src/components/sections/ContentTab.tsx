import React, { useMemo, useState } from "react";
import TopWordsTable from "../content/TopWordsTable";
import MediaStatsTable from "../content/MediaStatsTable";
import LongestMessagesCard from "../content/LongestMessagesCard";
import type { ParsedMessage } from "../../types";
import { pageSlice } from "../../lib/helpers";

function canonicalMediaType(raw?: string): string {
  const k = (raw ?? "").toLowerCase();
  if (!k) return "other";
  if (["sticker"].includes(k)) return "sticker";
  if (["photo", "image", "picture"].includes(k)) return "photo";
  if (["video"].includes(k)) return "video";
  if (["animation", "gif"].includes(k)) return "gif";
  if (["voice_message", "voice"].includes(k)) return "voice";
  if (["video_message", "roundvideo", "round_video"].includes(k))
    return "round_video";
  if (["audio", "music"].includes(k)) return "audio";
  if (["file", "document", "doc"].includes(k)) return "file";
  if (["poll"].includes(k)) return "poll";
  if (["contact"].includes(k)) return "contact";
  if (["location", "venue"].includes(k)) return "location";
  if (["game"].includes(k)) return "game";
  if (["story"].includes(k)) return "story";
  return "other";
}

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
      pageSlice(wordsAll, wordsPage, wordsPageSize).map((w, i) => ({
        rank: wordsPage * wordsPageSize + i + 1,
        word: w.word,
        count: w.count,
      })),
    [wordsAll, wordsPage],
  );

  // ===== MEDIA STATS (нормализация + агрегация) =====
  const mediaStats = useMemo(() => {
    const byCanonical: Record<string, number> = {};
    for (const m of humans) {
      const key = canonicalMediaType((m as any).media_type);
      if (key !== "other") byCanonical[key] = (byCanonical[key] ?? 0) + 1;
      else if ((m as any).media_type)
        byCanonical.other = (byCanonical.other ?? 0) + 1;
    }
    return byCanonical;
  }, [humans]);

  // ===== LONGEST MESSAGES (TOP-10) =====
  const longRows = useMemo(
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
      {/* Ряд: Топ слов (слева) + Медиа-статистика (справа) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Топ слов */}
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

        {/* Медиа-статистика */}
        <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
          <div className="hdr mb-3">🖼️ Медиа-статистика</div>
          <MediaStatsTable stats={mediaStats} />
        </div>
      </div>

      {/* Самые длинные — единая карточка */}
      <LongestMessagesCard rows={longRows} chatSlug={chatSlug} />
    </div>
  );
}

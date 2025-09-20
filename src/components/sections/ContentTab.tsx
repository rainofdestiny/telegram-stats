import React, { useMemo, useState } from "react";
import TopWordsTable from "../content/TopWordsTable";
import MediaStatsTable from "../content/MediaStatsTable";
import LongestMessagesTable from "../content/LongestMessagesTable";
import type { ParsedMessage } from "../../types";
import { pageSlice } from "../../lib/helpers";

export default function ContentTab({
  humans,
  chatSlug,
}: {
  humans: ParsedMessage[];
  chatSlug: string;
}) {
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
      pageSlice(wordsAll, wordsPage, wordsPageSize).map(
        (w: { word: string; count: number }, i: number) => ({
          rank: wordsPage * wordsPageSize + i + 1,
          word: w.word,
          count: w.count,
        }),
      ),
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
          <div className="flex justify-between items-center mb-3">
            <div className="hdr">🧠 Топ слов</div>
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
          <MediaStatsTable stats={mediaStatsMap} />
        </div>
      </div>

      <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
        <div className="hdr mb-3">✍️ Самые длинные сообщения</div>
        <LongestMessagesTable rows={longMsgs} chatSlug={chatSlug} />
      </div>
    </>
  );
}

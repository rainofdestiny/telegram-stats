import React from "react";

const RU: Record<string, string> = {
  photo: "Фото",
  video: "Видео",
  animation: "GIF / анимация",
  sticker: "Стикер",
  voice_message: "Голосовое сообщение",
  video_message: "Видеосообщение",
  audio: "Аудио",
  file: "Файл",
  poll: "Опрос",
  other: "Другое",
};

export default function MediaStatsTable({
  stats,
}: {
  stats: Record<string, number>;
}) {
  const rows = Object.entries(stats)
    .map(([k, v]) => ({ type: RU[k] ?? RU.other, count: v }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-slate-300">
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800">
              Тип
            </th>
            <th className="px-3 py-2 text-right font-medium border-b border-slate-800 w-24">
              Количество
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.type}-${i}`} className="hover:bg-white/5">
              <td className="px-3 py-2 border-b border-slate-800">{r.type}</td>
              <td className="px-3 py-2 border-b border-slate-800 text-right">
                {r.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

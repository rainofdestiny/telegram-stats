import React from "react";

type Props = { stats: Record<string, number> };

const RU_LABEL: Record<string, string> = {
  text: "Текст",
  photo: "Фото",
  video: "Видео",
  sticker: "Стикер",
  animation: "GIF/Анимация",
  audio: "Аудио",
  voice: "Голосовое сообщение",
  video_message: "Видеосообщение",
  file: "Файл/Документ",
  contact: "Контакт",
  location: "Локация",
  poll: "Опрос",
  game: "Игра",
  invoice: "Счёт/Платёж",
};

export default function MediaStatsTable({ stats }: Props) {
  const rows = Object.entries(stats)
    .map(([kind, count]) => ({
      label: RU_LABEL[kind] ?? kind,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .map((x, i) => ({ rank: i + 1, ...x }));

  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr">🖼️ Медиа-статистика</div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-300">
            <tr className="border-b border-white/5">
              <th className="px-3 py-2 w-10">#</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2 text-right">Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-b border-white/5/20">
                <td className="px-3 py-2 text-gray-300">{r.rank}</td>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2 text-right">{r.count}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-gray-400" colSpan={3}>
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

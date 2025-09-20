// src/components/content/MediaStatsTable.tsx
import React, { useMemo } from "react";

type Props = { stats: Record<string, number> };

// Русификация и объединение синонимов в финальные ярлыки
function ruLabel(canonical: string): string {
  switch (canonical) {
    case "sticker":
      return "Стикер";
    case "photo":
      return "Фото";
    case "video":
      return "Видео";
    case "gif":
      return "GIF";
    case "voice":
      return "Голосовое сообщение";
    case "round_video":
      return "Кружок (видео-сообщение)";
    case "audio":
      return "Аудио";
    case "file":
      return "Файл";
    case "poll":
      return "Опрос";
    case "contact":
      return "Контакт";
    case "location":
      return "Локация";
    case "game":
      return "Игра";
    case "story":
      return "Сторис";
    default:
      return "Другое";
  }
}

export default function MediaStatsTable({ stats }: Props) {
  // агрегируем ПОСЛЕ русификации, чтобы не было нескольких строк «Другое»
  const rows = useMemo(() => {
    const agg: Record<string, number> = {};
    Object.entries(stats).forEach(([k, c]) => {
      const label = ruLabel(k);
      agg[label] = (agg[label] ?? 0) + c;
    });
    return Object.entries(agg)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [stats]);

  return (
    <div className="overflow-x-auto -mx-2 md:mx-0">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-slate-200">
        <thead>
          <tr className="text-slate-400">
            <th className="text-left font-normal px-3 py-2">Тип</th>
            <th className="w-36 text-right font-normal px-3 py-2">
              Количество
            </th>
          </tr>
          <tr>
            <td colSpan={2} className="h-px bg-white/5" />
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <React.Fragment key={`${r.type}-${i}`}>
              <tr className="hover:bg-white/5 transition">
                <td className="px-3 py-2 align-middle truncate">{r.type}</td>
                <td className="px-3 py-2 align-middle text-right tabular-nums">
                  {r.count.toLocaleString("ru-RU")}
                </td>
              </tr>
              {i !== rows.length - 1 && (
                <tr>
                  <td colSpan={2} className="h-px bg-white/5" />
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

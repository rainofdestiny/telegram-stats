// src/components/TopMessagesTable.tsx
import React from "react";

export type MessageRow = {
  rank: number;
  from: string;
  text?: string;
  reactions: number;
  id?: number;
};

type Props = {
  rows: MessageRow[];
  chatSlug?: string; // если есть — можно добавить ссылку на сообщение
};

export default function TopMessagesTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto -mx-2 md:mx-0">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-slate-200">
        <thead>
          <tr className="text-slate-400">
            <th className="w-10 text-left font-normal px-3 py-2">#</th>
            <th className="w-44 text-left font-normal px-3 py-2">Автор</th>
            <th className="text-left font-normal px-3 py-2">Сообщение</th>
            <th className="w-28 text-right font-normal px-3 py-2">Реакции</th>
          </tr>
          <tr>
            <td colSpan={4} className="h-px bg-white/5" />
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => (
            <React.Fragment key={`${r.rank}-${r.from}-${r.id ?? i}`}>
              <tr className="hover:bg-white/5 transition">
                <td className="px-3 py-2 align-middle tabular-nums">
                  {r.rank}
                </td>
                <td className="px-3 py-2 align-middle truncate">{r.from}</td>
                <td className="px-3 py-2 align-middle truncate">
                  {r.text?.trim() ? r.text : "(без текста)"}
                </td>
                <td className="px-3 py-2 align-middle text-right tabular-nums">
                  {r.reactions.toLocaleString("ru-RU")}
                </td>
              </tr>
              {i !== rows.length - 1 && (
                <tr>
                  <td colSpan={4} className="h-px bg-white/5" />
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

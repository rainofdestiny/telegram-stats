import React from "react";

type Row = {
  rank: number;
  id?: number;
  from: string;
  text: string;
  reactions: number;
};

export default function TopMessagesTable({
  rows,
  chatSlug, // оставляем проп, но не оборачиваем ни во что — без доп. рамок
}: {
  rows: Row[];
  chatSlug?: string;
}) {
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
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.id ?? ""}`} className="hover:bg-white/5">
              <td className="px-3 py-2 align-middle text-slate-300">
                {r.rank}
              </td>
              <td className="px-3 py-2 align-middle truncate">{r.from}</td>
              <td className="px-3 py-2 align-middle">
                <span className="line-clamp-1">
                  {r.text?.trim() ? r.text : "(без текста)"}
                </span>
              </td>
              <td className="px-3 py-2 align-middle text-right tabular-nums">
                {r.reactions.toLocaleString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

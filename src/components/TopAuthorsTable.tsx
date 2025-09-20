import React from "react";

type Row = { rank: number; from: string; count: number };

export default function TopAuthorsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto -mx-2 md:mx-0">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-slate-200">
        <thead>
          <tr className="text-slate-400">
            <th className="w-10 text-left font-normal px-3 py-2">#</th>
            <th className="text-left font-normal px-3 py-2">Автор</th>
            <th className="w-36 text-right font-normal px-3 py-2">Сообщений</th>
          </tr>
          <tr>
            <td colSpan={3} className="h-px bg-white/5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="hover:bg-white/5">
              <td className="px-3 py-2 align-middle text-slate-300">
                {r.rank}
              </td>
              <td className="px-3 py-2 align-middle truncate">{r.from}</td>
              <td className="px-3 py-2 align-middle text-right tabular-nums">
                {r.count.toLocaleString("ru-RU")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

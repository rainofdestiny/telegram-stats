import React from "react";

type Row = { rank: number; emoji: string; count: number };

export default function TopEmojisTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr">🏆 Популярные эмодзи</div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-300">
            <tr className="border-b border-white/5">
              <th className="px-3 py-2 w-10">#</th>
              <th className="px-3 py-2">Эмодзи</th>
              <th className="px-3 py-2 text-right">Раз</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-b border-white/5/20">
                <td className="px-3 py-2 text-gray-300">{r.rank}</td>
                <td className="px-3 py-2 text-lg">{r.emoji}</td>
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

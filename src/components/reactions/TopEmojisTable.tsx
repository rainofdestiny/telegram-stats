import React from "react";

export default function TopEmojisTable({
  rows,
}: {
  rows: { emoji: string; count: number }[];
}) {
  return (
    <div className="card">
      <div className="hdr mb-3">😀 Популярные эмодзи</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-slate-700">
              <th className="py-2">#</th>
              <th className="py-2">Эмодзи</th>
              <th className="py-2">Использований</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.emoji}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition"
              >
                <td className="py-2">{i + 1}</td>
                <td className="py-2 text-xl">{r.emoji}</td>
                <td className="py-2">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

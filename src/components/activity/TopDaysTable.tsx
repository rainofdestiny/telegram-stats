import React from "react";

export default function TopDaysTable({
  rows,
  top = 10,
}: {
  rows: { date: string; count: number }[];
  top?: number;
}) {
  const data = [...rows].sort((a, b) => b.count - a.count).slice(0, top);
  return (
    <div className="card">
      <div className="hdr mb-3">🏆 Топ дней по сообщениям</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-slate-700">
              <th className="py-2">#</th>
              <th className="py-2">Дата</th>
              <th className="py-2">Сообщений</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr
                key={r.date}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition"
              >
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{r.date}</td>
                <td className="py-2">{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

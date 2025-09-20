import React from "react";

export default function MediaStatsTable({
  stats,
}: {
  stats: Record<string, number>;
}) {
  const entries = Object.entries(stats);
  return (
    <div className="card">
      <div className="hdr mb-3">🖼️ Медиа-статистика</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-slate-700">
              <th className="py-2">Тип</th>
              <th className="py-2">Количество</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val]) => (
              <tr
                key={key}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition"
              >
                <td className="py-2 capitalize">{key}</td>
                <td className="py-2">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

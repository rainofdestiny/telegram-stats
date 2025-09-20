import React from "react";
import { Row } from "../../types";

export default function TopReactionAuthorsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr mb-3">👥 Авторы с наибольшим количеством реакций</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Автор</th>
              <th className="px-3 py-2">Реакции</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rank} className="border-t border-slate-800">
                <td className="px-3 py-2">{r.rank}</td>
                <td className="px-3 py-2">{r.from}</td>
                <td className="px-3 py-2 font-semibold text-purple-300">
                  {r.reactions ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

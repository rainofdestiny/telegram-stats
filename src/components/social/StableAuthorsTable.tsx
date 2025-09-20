import React from "react";
import { Row } from "../../types";

interface Props {
  rows: Row[];
}

export default function StableAuthorsTable({ rows }: Props) {
  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr mb-3">📅 Стабильные авторы (пишут каждую неделю)</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Автор</th>
              <th className="px-3 py-2">Недель подряд</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.rank}
                className="border-t border-slate-800 hover:bg-slate-800/40"
              >
                <td className="px-3 py-2">{r.rank}</td>
                <td className="px-3 py-2">{r.from}</td>
                <td className="px-3 py-2 font-bold text-purple-400">
                  {r.weeks ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

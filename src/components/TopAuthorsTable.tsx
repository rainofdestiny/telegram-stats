import React from "react";

type Row = { rank: number; from?: string; name?: string; count: number };

interface Props {
  rows: Row[];
  /** Если true — без внешней карточки, только таблица */
  bare?: boolean;
}

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-300 border-b border-slate-700">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Автор</th>
            <th className="py-2 pr-3">Сообщений</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-b border-slate-800">
              <td className="py-2 pr-3 text-slate-400">{r.rank}</td>
              <td className="py-2 pr-3">{r.name ?? r.from ?? "—"}</td>
              <td className="py-2 pr-3">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TopAuthorsTable({ rows, bare }: Props) {
  if (bare) return <Table rows={rows} />;

  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <Table rows={rows} />
    </div>
  );
}

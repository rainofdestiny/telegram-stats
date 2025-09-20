type Row = { rank: number; word: string; count: number };

export default function TopWordsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr mb-3">📝 Топ слов</div>

      <table className="w-full table-fixed text-sm">
        <thead className="text-slate-300">
          <tr>
            <th className="text-left p-2 w-16">#</th>
            <th className="text-left p-2">Слово</th>
            <th className="text-right p-2 w-24">Частота</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-b border-white/5 last:border-0">
              <td className="p-2 text-slate-300">{r.rank}</td>
              <td className="p-2">{r.word}</td>
              <td className="p-2 text-right">{r.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

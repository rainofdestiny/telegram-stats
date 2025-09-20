import React from "react";

export default function LongestMessagesTable({
  rows,
  chatSlug,
}: {
  rows: { id: number; from: string; text: string; length: number }[];
  chatSlug: string;
}) {
  return (
    <div className="card">
      <div className="hdr mb-3">📜 Самые длинные сообщения</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-slate-700">
              <th className="py-2">#</th>
              <th className="py-2">Автор</th>
              <th className="py-2">Длина</th>
              <th className="py-2">Текст</th>
              <th className="py-2">Ссылка</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className="border-b border-slate-800 hover:bg-slate-800/40 transition"
              >
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{r.from}</td>
                <td className="py-2">{r.length}</td>
                <td className="py-2 max-w-md truncate">{r.text}</td>
                <td className="py-2">
                  <a
                    href={`https://t.me/${chatSlug}/${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline"
                  >
                    🔗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from "react";

type Row = {
  id: number;
  from: string;
  text: string;
  length: number;
};

export default function LongestMessagesCard({
  rows,
  chatSlug,
  limit = 10,
}: {
  rows: Row[];
  chatSlug: string;
  limit?: number;
}) {
  const top = rows.slice(0, limit);

  const linkFor = (id: number) =>
    chatSlug ? `https://t.me/${chatSlug}/${id}` : undefined;

  return (
    <div className="card relative bg-gradient-to-br from-[#111122] to-[#0a0a15] shadow-lg shadow-purple-500/20">
      <div className="hdr mb-3">📜 Самые длинные сообщения</div>

      <div className="overflow-x-auto -mx-2 md:mx-0">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm text-slate-200">
          <thead>
            <tr className="text-slate-400">
              <th className="w-10 text-left font-normal px-3 py-2">#</th>
              <th className="w-48 text-left font-normal px-3 py-2">Автор</th>
              <th className="w-20 text-right font-normal px-3 py-2">Длина</th>
              <th className="text-left font-normal px-3 py-2">Текст</th>
              <th className="w-16 text-right font-normal px-3 py-2">Ссылка</th>
            </tr>
            <tr>
              <td colSpan={5} className="h-px bg-white/5" />
            </tr>
          </thead>
          <tbody>
            {top.map((r, i) => {
              const url = linkFor(r.id);
              return (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-3 py-2 align-middle text-slate-300">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 align-middle truncate">{r.from}</td>
                  <td className="px-3 py-2 align-middle text-right tabular-nums">
                    {r.length.toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="line-clamp-1">
                      {r.text?.trim() ? r.text : "(без текста)"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 hover:bg-purple-600 transition"
                        title="Открыть в Telegram"
                      >
                        🔗
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

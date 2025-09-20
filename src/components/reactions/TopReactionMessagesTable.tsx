import React from "react";
import type { Row } from "../../types";

export default function TopReactionMessagesTable({
  rows,
  chatSlug,
}: {
  rows: Row[];
  chatSlug: string;
}) {
  const mkLink = (id?: string | number) =>
    id != null && chatSlug ? `https://t.me/${chatSlug}/${id}` : undefined;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-slate-300">
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800 w-14">
              #
            </th>
            <th className="px-3 py-2 text-left font-medium border-b border-slate-800">
              Сообщение
            </th>
            <th className="px-3 py-2 text-right font-medium border-b border-slate-800 w-28">
              Реакции
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const link = mkLink(r.id as string | number | undefined);
            return (
              <tr key={`${r.rank}-${r.id ?? "x"}`} className="hover:bg-white/5">
                <td className="px-3 py-2 border-b border-slate-800 align-top">
                  {r.rank}
                </td>
                <td className="px-3 py-2 border-b border-slate-800 align-top">
                  <div className="text-xs text-slate-400 mb-1">{r.from}</div>
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      className="underline decoration-purple-500/60"
                    >
                      {r.text || "(без текста)"}
                    </a>
                  ) : (
                    <span>{r.text || "(без текста)"}</span>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-slate-800 align-top text-right">
                  {r.reactions ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
